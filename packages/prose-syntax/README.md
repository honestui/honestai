# Honest Prose Syntax

Reading-first syntax highlighting with Shiki grammars, Honest token roles, and CSS themes. This package is prepared for release; it is not yet published.

```js
import { createHighlighter } from '@honestui/prose-syntax'
import '@honestui/prose-syntax/style.css'
const syntax = createHighlighter()
const html = await syntax.toHtml('const name = "Ada"', { language: 'js' })
syntax.dispose()
```

React: import `SyntaxCode` from `@honestui/prose-syntax/react`.
Plain HTML: self-host the entire `dist` directory, import `prose-syntax-browser.js`, and call `highlightAll(document)` on `<pre data-honest-syntax><code class="language-js">…</code></pre>` blocks.

The browser entry uses a module worker resolved relative to its module URL. Deploy all emitted chunks together. Core/server HTML needs only the stylesheet in the browser. The optional React peer is needed only for the React entry.

Languages: JS, TS, JSX, TSX, HTML, CSS, JSON, Markdown, Bash, Python, SQL, YAML. Extra trusted grammars can be added through the core `languages` option. Source is never executed or sent to a service.

Themes follow `.light`/`.dark` or system preference. Override a surface with `data-syntax-theme="light"` or `"dark"`. Customize `--prose-syntax-*` variables and verify contrast for your surfaces.

Browser jobs default to a one-second timeout and 200,000 UTF-8 bytes. Failures retain plain source. Core offers `highlight`, `toHtml`, `release`, and `dispose`; browser offers `createBrowserHighlighter`, `highlightElement`, `highlightAll`, and `dispose`. Call instance disposal when finished. Diagnostics never contain source.

Build from this repository with `npm run syntax:build`; pack with `npm pack ./packages/prose-syntax`. Source lives in `registry/lib/prose-syntax*` and `registry/styles/prose-syntax-theme.css` so registry and package implementations stay aligned.

Token palettes: set `data-syntax-palette="violet"` or `"graphite"` on the code surface. Each supports light and dark themes and works with the CSS or Tailwind exports. Violet remains the default; explicit token-variable overrides take precedence.
