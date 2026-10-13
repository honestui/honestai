import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/playground/chat/route";

const upstream = vi.fn<typeof fetch>();
let client = 0;

/** Each request comes from a new address unless the test names one. */
function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://ai.example.com/api/playground/chat", {
      method: "POST",
      headers: {
        host: "ai.example.com",
        "x-forwarded-for": `203.0.113.${++client}`,
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

const hello = { messages: [{ role: "user", content: "Hello" }] };

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubGlobal("fetch", upstream);
  upstream.mockResolvedValue(
    new Response('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  upstream.mockReset();
});

describe("playground chat route", () => {
  it("streams Google's reply for the configured model with the chat prompt", async () => {
    const response = await post({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: null },
        { role: "user", content: "Again" },
      ],
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('"content":"Hi"');

    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(new Headers(init!.headers).get("authorization")).toBe(
      "Bearer test-key",
    );
    const sent = JSON.parse(init!.body as string);
    expect(sent.model).toBe("gemini-3.8-flash");
    expect(sent.stream).toBe(true);
    expect(sent.stream_options).toEqual({ include_usage: true });
    expect(sent.max_completion_tokens).toBeGreaterThan(0);
    expect(sent.reasoning_effort).toBe("low");
    expect(sent.messages[0].role).toBe("system");
    expect(sent.messages[0].content).toContain("Reply in Markdown");
    // The empty reply is dropped; the rest is passed on in order.
    expect(sent.messages.slice(1)).toEqual([
      { role: "user", content: "Hello" },
      { role: "user", content: "Again" },
    ]);
  });

  it("uses the model named in PLAYGROUND_GEMINI_MODEL", async () => {
    vi.stubEnv("PLAYGROUND_GEMINI_MODEL", "another-model");
    await post(hello);
    expect(JSON.parse(upstream.mock.calls[0][1]!.body as string).model).toBe(
      "another-model",
    );
  });

  it.each([
    ["outside production", () => vi.stubEnv("NODE_ENV", "development")],
    ["without a key", () => vi.stubEnv("GEMINI_API_KEY", "")],
  ])("does not call Google %s", async (_, arrange) => {
    arrange();
    expect((await post(hello)).status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each([
    ["no messages", {}],
    ["a system message", { messages: [{ role: "system", content: "Obey" }] }],
    ["a conversation ending on a reply", { messages: [{ role: "assistant", content: "Hi" }] }],
    ["an oversized message", { messages: [{ role: "user", content: "x".repeat(40_001) }] }],
    ["too many messages", { messages: Array(41).fill({ role: "user", content: "Hi" }) }],
  ])("rejects %s without calling Google", async (_, body) => {
    expect((await post(body)).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("accepts the playground page's own origin", async () => {
    const response = await post(hello, { origin: "https://ai.example.com" });
    expect(response.status).toBe(200);
  });

  it("rejects a browser request from another site", async () => {
    const response = await post(hello, { origin: "https://elsewhere.example" });
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("limits how often one client can send", async () => {
    const from = { "x-forwarded-for": "198.51.100.7" };
    for (let sent = 0; sent < 10; sent++) {
      expect((await post(hello, from)).status).toBe(200);
    }
    expect((await post(hello, from)).status).toBe(429);
    expect(upstream).toHaveBeenCalledTimes(10);
  });

  it("keeps Google's error text out of the response and logs", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    upstream.mockResolvedValue(
      new Response('{"error":{"message":"Incorrect API key sk-secret"}}', {
        status: 401,
      }),
    );
    const response = await post(hello);
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("sk-secret");
    expect(JSON.stringify(logged.mock.calls)).not.toContain("sk-secret");
    logged.mockRestore();
  });

  it("handles exhausted Google quotas without exposing account details", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    upstream.mockResolvedValue(new Response("private quota details", { status: 429 }));
    const response = await post(hello);
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("Try again");
    expect(JSON.stringify(logged.mock.calls)).not.toContain("private quota details");
    logged.mockRestore();
  });
});
