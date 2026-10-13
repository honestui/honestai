import { afterEach, expect, it, vi } from "vitest";
import { createHostedLLM } from "@/components/docs/playground/hosted";
import { getPlaygroundProvider } from "@/lib/playground-provider";
import { EventType } from "@/registry/generative/chat";

afterEach(() => vi.unstubAllEnvs());

const data = (chunk: object) => `data: ${JSON.stringify(chunk)}\n\n`;

async function replyAndCount(body: string) {
  const counted = vi.fn();
  const { streamProtocol } = createHostedLLM({ onContextUsed: counted });
  const text: string[] = [];
  for await (const event of streamProtocol.parse(new Response(body))) {
    if (event.type === EventType.TEXT_MESSAGE_CONTENT) text.push(event.delta);
  }
  // The count is read from a copy of the response, beside the reply.
  await new Promise((resolve) => setTimeout(resolve, 10));
  return { text: text.join(""), counted };
}

it("reports the tokens Google counted without disturbing the reply", async () => {
  const { text, counted } = await replyAndCount(
    data({ choices: [{ delta: { role: "assistant", content: "Hi" } }], usage: null }) +
      data({ choices: [{ delta: {}, finish_reason: "stop" }], usage: null }) +
      data({ choices: [], usage: { prompt_tokens: 14_200, completion_tokens: 12, total_tokens: 14_212 } }) +
      "data: [DONE]\n\n",
  );
  expect(text).toBe("Hi");
  expect(counted).toHaveBeenCalledExactlyOnceWith(14_212);
});

it("reports nothing when the stream carries no usage", async () => {
  const { text, counted } = await replyAndCount(
    data({ choices: [{ delta: { content: "Hi" } }] }) + "data: [DONE]\n\n",
  );
  expect(text).toBe("Hi");
  expect(counted).not.toHaveBeenCalled();
});

it.each([
  ["128000", 128_000],
  ["", undefined],
  ["lots", undefined],
  ["-5", undefined],
  ["1.5", undefined],
])("reads PLAYGROUND_GEMINI_CONTEXT_TOKENS=%j as %j", (value, expected) => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("PLAYGROUND_GEMINI_CONTEXT_TOKENS", value);
  expect(getPlaygroundProvider()).toMatchObject({
    kind: "hosted",
    contextTokens: expected,
  });
});

it("lists configured providers without serializing API keys", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("OPENAI_API_KEY", "private-openai-key");
  vi.stubEnv("GEMINI_API_KEY", "private-google-key");
  const provider = getPlaygroundProvider();
  expect(provider).toMatchObject({
    kind: "hosted",
    model: "gpt-6-luna",
    models: [
      { model: "gpt-6-luna", provider: "openai" },
      { model: "gemini-3.8-flash", provider: "google" },
    ],
  });
  expect(JSON.stringify(provider)).not.toContain("private-");
  vi.stubEnv("NODE_ENV", "development");
  expect(getPlaygroundProvider()).toEqual({ kind: "ollama" });
});
