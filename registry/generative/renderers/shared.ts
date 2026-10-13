export type Props = Record<string, unknown>;
export function record(value: unknown): Props {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Props)
    : {};
}
export function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
export function nodeProps(value: unknown): Props {
  const item = record(value);
  return record(item.props ?? item);
}
export function text(value: unknown): string {
  return value == null ? "" : String(value);
}
/** Model-generated URLs are never used as script or data URLs. */
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    /* Invalid model output has no link. */
  }
}
