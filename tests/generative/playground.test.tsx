// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

it("the hosted playground sends to this site's server and names no local model", async () => {
  const chunk = (delta: object, finish: string | null = null) =>
    `data: ${JSON.stringify({ choices: [{ delta, finish_reason: finish }] })}\n\n`;
  const server = vi.fn<typeof fetch>(async () =>
    new Response(
      chunk({ role: "assistant", content: "## Hosted reply" }) +
        chunk({}, "stop") +
        "data: [DONE]\n\n",
      { headers: { "Content-Type": "text/event-stream" } },
    ),
  );
  // The transport keeps the fetch it finds when the module loads.
  vi.stubGlobal("fetch", server);
  const { Playground } = await import(
    "@/components/docs/playground/playground"
  );

  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(
      <Playground provider={{ kind: "hosted", model: "gemini-3.8-flash" }} />,
    );
  });
  expect(container.textContent).toContain("gemini-3.8-flash");
  expect(container.textContent).toContain("Messages are sent to Google");
  expect(container.textContent).not.toMatch(/Ollama|local model/i);

  const input = container.querySelector(
    'textarea[aria-label="Prompt"]',
  ) as HTMLTextAreaElement;
  expect(input.disabled).toBe(false);
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

  const [url, init] = server.mock.calls[0];
  expect(url).toBe("/api/playground/chat");
  expect(JSON.parse(init!.body as string).messages).toEqual([
    { role: "user", content: "Hello" },
  ]);
  expect(container.querySelector(".honest-prose h2")?.textContent).toBe(
    "Hosted reply",
  );
  await React.act(async () => root.unmount());
});
