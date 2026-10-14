import Prism from "prismjs"
import hljs from "highlight.js/lib/core"
import javascript from "highlight.js/lib/languages/javascript"
import { codeToHtml } from "shiki"
import { createHighlighter } from "@/registry/lib/prose-syntax"
import ProseSyntaxDemo from "@/registry/examples/prose-syntax-demo"
import "./themes.css"

export const metadata = { title: "Syntax appearance review", robots: { index: false, follow: false } }
const source = '// Keep the original order.\nexport function activeNames(users) {\n  return users.filter(user => user.active)\n    .map(user => `Hello, ${user.name}`)\n}\n'
hljs.registerLanguage("javascript", javascript)

export default async function SyntaxReview() {
  const highlighter = createHighlighter()
  let honest: string
  try { honest = await highlighter.toHtml(source, { language: "js" }) } finally { highlighter.dispose() }
  const prism = Prism.highlight(source, Prism.languages.javascript, "javascript")
  const highlight = hljs.highlight(source, { language: "javascript" }).value
  return <main className="mx-auto max-w-6xl space-y-8 p-6">
    <h1 className="text-2xl font-semibold">Syntax appearance review</h1>
    <p>Identical source and type size. Compare comments, punctuation, strings, and functions. These themes are examples, not a ranking of the engines.</p>
    <ProseSyntaxDemo />
    {await Promise.all((["light", "dark"] as const).map(async theme => <section key={theme} aria-label={`${theme} comparison`} className="space-y-4">
      <h2 className="text-xl">{theme === "light" ? "Light" : "Dark"} themes</h2>
      <div className="syntax-comparison grid gap-4 lg:grid-cols-2">
        <article data-syntax-theme={theme}><h3>Honest Prose · Violet</h3><div dangerouslySetInnerHTML={{ __html: honest.replace('class="honest-syntax"', `class="honest-syntax" data-syntax-theme="${theme}"`) }} /></article>
        <article className={`prism-${theme}`}><h3>Prism · {theme === "light" ? "Default" : "Tomorrow"}</h3><pre tabIndex={0} aria-label="Prism sample" className="language-javascript"><code className="language-javascript" dangerouslySetInnerHTML={{ __html: prism }} /></pre></article>
        <article className={`highlight-${theme}`}><h3>highlight.js · GitHub{theme === "dark" ? " Dark" : ""}</h3><pre tabIndex={0} aria-label="highlight.js sample"><code className="hljs" dangerouslySetInnerHTML={{ __html: highlight }} /></pre></article>
        <article><h3>Shiki · GitHub {theme}</h3><div dangerouslySetInnerHTML={{ __html: (await codeToHtml(source, { lang: "javascript", theme: `github-${theme}` })).replace(/class="shiki[^"]*"/, 'class="reference-code"') }} /></article>
      </div>
    </section>))}
  </main>
}
