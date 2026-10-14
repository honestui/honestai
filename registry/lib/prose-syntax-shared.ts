export type SyntaxPalette = "violet" | "graphite"
export const syntaxRoles = ["plain", "comment", "keyword", "string", "constant", "function", "type", "property", "tag", "punctuation"] as const
export type SyntaxRole = (typeof syntaxRoles)[number]
/** Roles an editor needs beyond reading: names, parameters, operators, and code that does not parse. */
export type EditorSyntaxRole = SyntaxRole | "variable" | "parameter" | "operator" | "invalid"
/** Language Server Protocol token types, by role. Unlisted types keep the grammar's color. */
export const semanticTokenRoles: Record<string, EditorSyntaxRole> = {
  namespace: "type", type: "type", class: "type", enum: "type", interface: "type", struct: "type", typeParameter: "type",
  parameter: "parameter", variable: "variable", property: "property", enumMember: "constant", event: "property",
  function: "function", method: "function", macro: "function", decorator: "function",
  keyword: "keyword", modifier: "keyword", comment: "comment", string: "string", number: "constant", regexp: "string", operator: "operator",
}
/** The TextMate scopes each role colors. Shared by the Shiki engine and the VS Code theme. */
export const syntaxRoleScopes: Record<SyntaxRole, string[]> = {
  plain: [],
  comment: ["comment"],
  keyword: ["keyword", "storage"],
  string: ["string"],
  constant: ["constant"],
  function: ["entity.name.function", "support.function"],
  type: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
  property: ["variable.other.property", "support.type.property-name", "entity.other.attribute-name"],
  tag: ["entity.name.tag"],
  punctuation: ["punctuation"],
}
export type SyntaxToken = { text: string; role: SyntaxRole }
export type SyntaxResult = { lines: SyntaxToken[][]; highlighted: boolean }
export type SyntaxDiagnostic = { reason: "unknown-language" | "load-failed" | "too-large" | "timeout" | "worker-failed"; language?: string }
export type SyntaxOptions = { language?: string; session?: string }

export function plainResult(code: string): SyntaxResult {
  return { lines: code.split("\n").map(text => [{ text, role: "plain" }]), highlighted: false }
}
export function escapeHtml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;")
}
export function renderTokens(result: SyntaxResult) {
  return result.lines.map(line => line.map(token => `<span class="prose-syntax-${token.role}">${escapeHtml(token.text)}</span>`).join("")).join("\n")
}

