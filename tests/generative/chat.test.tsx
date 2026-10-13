// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import {
  EventType,
  GenerativeChat,
  agUIAdapter,
  type ChatLLM,
} from "@/registry/generative/chat";
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  document.body.innerHTML = "";
});
it("preserves the composer draft when its transport fails", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(
      <GenerativeChat
        llm={{
          streamProtocol: agUIAdapter(),
          send: async () => new Response("Unavailable", { status: 503 }),
        }}
      />,
    );
  });
  const input = container.querySelector(
    'textarea[aria-label="Prompt"]',
  ) as HTMLTextAreaElement;
  expect(input).not.toBeNull();
  await React.act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!;
    setter.call(input, "Keep my draft");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    input
      .closest("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(container.textContent).toContain("The response failed.");
  expect(input.value).toBe("Keep my draft");
  await React.act(async () => {
    root.unmount();
  });
});

/** A transport whose every reply is the given text. */
function replyWith(text: string): ChatLLM {
  return {
    streamProtocol: agUIAdapter(),
    send: async () => {
      const messageId = "reply";
      const events = [
        { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text },
        { type: EventType.TEXT_MESSAGE_END, messageId },
      ];
      return new Response(
        events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    },
  };
}

async function renderReply(text: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(<GenerativeChat llm={replyWith(text)} />);
  });
  const input = container.querySelector(
    'textarea[aria-label="Prompt"]',
  ) as HTMLTextAreaElement;
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(input, "Hello");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    input
      .closest("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  // The second message is the assistant's.
  const reply = container.querySelectorAll('[data-slot="chat-message"]')[1];
  return { reply, unmount: () => React.act(async () => root.unmount()) };
}

it("renders a reply as Markdown and only its fenced block as components", async () => {
  const { reply, unmount } = await renderReply(
    [
      "## Budget",
      "",
      "Rent is the largest cost.",
      "",
      "```honestai",
      "root = Stack([notice])",
      'notice = Callout("info", "Generated", "From the block.")',
      "```",
      "",
      "Prose after the block.",
      "",
      "```ts",
      "const kept = true;",
      "```",
    ].join("\n"),
  );
  const prose = [...reply.querySelectorAll(".honest-prose")].map(
    (element) => element.textContent,
  );
  expect(prose).toHaveLength(2);
  expect(reply.querySelector(".honest-prose h2")?.textContent).toBe("Budget");
  expect(prose[1]).toContain("Prose after the block.");
  // An ordinary code block stays a code block.
  expect(prose[1]).toContain("const kept = true;");
  expect(reply.querySelector('[data-slot="alert"]')?.textContent).toContain(
    "From the block.",
  );
  expect(reply.textContent).not.toContain("root = Stack");
  expect(reply.querySelector('[data-slot="card"]')).toBeNull();
  await unmount();
});

it("frames content in a card only where the reply asks for one", async () => {
  const { reply, unmount } = await renderReply(
    [
      "Fill this in:",
      "",
      "```honestai",
      "root = Stack([summary])",
      'summary = Card([CardHeader("Trip", "Two nights"), TextContent("Lisbon")])',
      "```",
    ].join("\n"),
  );
  expect(reply.querySelectorAll('[data-slot="card"]')).toHaveLength(1);
  expect(reply.querySelector('[data-slot="card"]')?.textContent).toContain(
    "Lisbon",
  );
  expect(reply.querySelector('[role="alert"]')).toBeNull();
  await unmount();
});

it("still renders a reply that is only a program", async () => {
  const { reply, unmount } = await renderReply(
    'root = Stack([note])\nnote = Callout("info", "Whole reply", "No Markdown around it.")',
  );
  expect(reply.querySelector('[data-slot="alert"]')?.textContent).toContain(
    "No Markdown around it.",
  );
  expect(reply.querySelector(".honest-prose")).toBeNull();
  await unmount();
});

it("reports a block only for what is missing from view", async () => {
  // The bad `subtextVariant` falls back to its default, so the card renders.
  const recovered = await renderReply(
    [
      "```honestai",
      "root = Stack([cards])",
      'cards = OverviewCardBlock([a, b], "grid", true)',
      'a = OverviewCardItem("a", Text("text", "Income", "Monthly", "default"))',
      'b = OverviewCardItem("b", Text("text", "Spend", "Monthly", "default"))',
      "```",
    ].join("\n"),
  );
  expect(recovered.reply.textContent).toContain("Income");
  expect(recovered.reply.querySelector('[role="alert"]')).toBeNull();
  await recovered.unmount();

  // An unknown component is dropped, so that is reported, once.
  const dropped = await renderReply(
    [
      "```honestai",
      "root = Stack([Missing(), Missing()])",
      "```",
    ].join("\n"),
  );
  const alert = dropped.reply.querySelector('[role="alert"]')?.textContent;
  expect(alert).toContain("Part of the generated interface could not be shown");
  expect(alert?.match(/Unknown component "Missing"/g)).toHaveLength(1);
  await dropped.unmount();
});

it("sends a generated button's message without an empty form payload", async () => {
  const { reply, unmount } = await renderReply([
    "root = Stack([button])",
    'button = Button("Add a savings goal", @ToAssistant("Add a savings goal"))',
  ].join("\n"));
  const transcript = reply.parentElement!;
  const button = reply.querySelector<HTMLButtonElement>("button")!;
  expect(button.textContent).toBe("Add a savings goal");
  await React.act(async () => button.click());
  const sent = [...transcript.querySelectorAll('[data-role="user"]')].at(-1)!;
  expect(sent.textContent).toContain("Add a savings goal");
  expect(sent.textContent).not.toContain("{}");
  await unmount();
});

it("keeps populated form values when a generated form sends a message", async () => {
  const { reply, unmount } = await renderReply([
    "root = Stack([form])",
    'form = Form("goal", buttons, [field])',
    'buttons = Buttons([Button("Save goal", @ToAssistant("Save goal"))])',
    'field = FormControl("Amount", Input("amount", "Amount", "text"))',
  ].join("\n"));
  const transcript = reply.parentElement!;
  const input = reply.querySelector<HTMLInputElement>("input")!;
  expect(input).not.toBeNull();
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "250");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => reply.querySelector<HTMLButtonElement>("button")!.click());
  const sent = [...transcript.querySelectorAll('[data-role="user"]')].at(-1)!;
  expect(sent.textContent).toContain("Save goal");
  expect(sent.textContent).toContain('"amount":{"value":"250"}');
  await unmount();
});
