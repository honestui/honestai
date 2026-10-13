/**
 * Where the docs playground gets its replies. A production build with an
 * AI Studio key answers through this site's server. Every other build talks to
 * the visitor's own Ollama from the browser, so local work spends nothing.
 */
export type PlaygroundProvider =
  | { kind: "ollama" }
  | {
      kind: "hosted";
      model: string;
      /** The model's context window, when the deployment states it. */
      contextTokens?: number;
    };

const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/** A whole number of tokens above zero, or nothing. No size is assumed for a model. */
function readContextTokens() {
  const tokens = Number(process.env.PLAYGROUND_GEMINI_CONTEXT_TOKENS);
  return Number.isInteger(tokens) && tokens > 0 ? tokens : undefined;
}

export function getPlaygroundProvider(): PlaygroundProvider {
  const isHosted =
    process.env.NODE_ENV === "production" && Boolean(process.env.GEMINI_API_KEY);
  return isHosted
    ? {
        kind: "hosted",
        model: process.env.PLAYGROUND_GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
        contextTokens: readContextTokens(),
      }
    : { kind: "ollama" };
}
