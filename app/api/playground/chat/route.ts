import { getPlaygroundProvider } from "@/lib/playground-provider";
import chatSpec from "@/registry/generative/chat-spec.json";
import { generateSystemPrompt } from "@/registry/generative/runtime/core";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// The endpoint is public and spends the site's key, so every request is bounded.
const MAX_MESSAGES = 40;
const MAX_CONVERSATION_CHARACTERS = 40_000;
const MAX_REPLY_TOKENS = 4_000;
const REQUESTS_PER_WINDOW = 10;
const WINDOW_MILLISECONDS = 60_000;

const systemPrompt = generateSystemPrompt({ library: chatSpec });

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Request times by client address. This lives in one server instance's
 * memory, so it slows a single abusive client but is not a spending limit.
 * Configure provider-level budget controls separately.
 */
const recentRequests = new Map<string, number[]>();

function isRateLimited(client: string, now: number) {
  const recent = (recentRequests.get(client) ?? []).filter(
    (time) => now - time < WINDOW_MILLISECONDS,
  );
  if (recent.length >= REQUESTS_PER_WINDOW) {
    recentRequests.set(client, recent);
    return true;
  }
  recentRequests.set(client, [...recent, now]);
  // Forget clients whose window has passed, so the map cannot grow forever.
  if (recentRequests.size > 5_000) {
    for (const [key, times] of recentRequests) {
      if (times.every((time) => now - time >= WINDOW_MILLISECONDS))
        recentRequests.delete(key);
    }
  }
  return false;
}

/** The user and assistant text of the conversation, or null when it is not a valid one. */
function readConversation(body: unknown): ChatMessage[] | null {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) return null;

  const conversation: ChatMessage[] = [];
  for (const message of messages) {
    const { role, content } = (message ?? {}) as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    // A reply with no text, such as one stopped before it began, adds nothing.
    if (typeof content !== "string" || content === "") continue;
    conversation.push({ role, content });
  }

  const characters = conversation.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  return conversation.at(-1)?.role === "user" &&
    characters <= MAX_CONVERSATION_CHARACTERS
    ? conversation
    : null;
}

function refuse(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const provider = getPlaygroundProvider();
  if (provider.kind !== "hosted") {
    return refuse(404, "This build answers from Ollama, not from the server.");
  }

  // A browser on another site sends its own Origin. Scripts can omit it, which
  // is why the limits below do not depend on this check.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return refuse(403, "This endpoint only serves the playground page.");
  }

  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(client, Date.now())) {
    return refuse(429, "Too many messages. Wait a minute, then send it again.");
  }

  const body = await request.json().catch(() => null);
  const requestedModel = body?.model ?? provider.model;
  const selected = provider.models?.find((item) => item.model === requestedModel);
  if (!selected) return refuse(400, "Choose an available playground model.");
  const conversation = readConversation(body);
  if (!conversation) {
    return refuse(
      400,
      "This conversation is too long for the playground. Start a new chat.",
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(selected.provider === "openai" ? OPENAI_URL : GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${selected.provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: selected.model,
        stream: true,
        // The last chunk then carries the token counts the context meter shows.
        stream_options: { include_usage: true },
        max_completion_tokens: MAX_REPLY_TOKENS,
        // Leave room for the visible reply within the bounded token budget.
        reasoning_effort: "low",
        messages: [{ role: "system", content: systemPrompt }, ...conversation],
      }),
      // Stopping the reply in the browser stops the upstream request.
      signal: request.signal,
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error(`Playground: the request to ${selected.provider} failed`, error instanceof Error ? error.name : "Unknown error");
    return refuse(502, "The model could not be reached. Try again in a moment.");
  }

  if (!upstream.ok || !upstream.body) {
    // Provider error bodies can contain account details; log only the status.
    console.error(`Playground: ${selected.provider} answered ${upstream.status}`);
    return upstream.status === 429
      ? refuse(503, "The playground is busy. Try again in a moment.")
      : refuse(502, "The model returned an error. Try again in a moment.");
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
