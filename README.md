# Honest AI

Copied React components for agent and chat interfaces: prompts, streaming replies, agent traces, tool calls, and approvals. Each component renders the state your application passes in. None of them calls a model.

Honest AI is built on [Honest UI](https://www.honestui.com). It uses Honest UI's theme tokens, components, icons, and charts, and it is installed with the Honest UI CLI.

## Install a component

From a project initialized with Honest UI:

```bash
npx honestui@latest init
npx honestui@latest add https://ai.honestui.com/r/prompt-bar.json
```

The CLI copies the component into `components/ai` and adds the Honest UI components it imports.

## Markdown starter

Markdown has these installable pieces:

- `prose`: plain CSS for rendered Markdown or HTML, with theme-token fallbacks. Copy `registry/styles/prose.css`, import it, and put `class="honest-prose"` on the text's wrapper. It works without React, Tailwind, or Honest UI.
- `prose-tailwind`: the same styles as Tailwind v4 utilities, with no separate stylesheet. Install it and use the exported `proseTailwind` class string; the playground also copies customized Tailwind classes.
- `repair-markdown`: a standalone function for unfinished Markdown, with no package dependencies.
- `markdown`: the React renderer, with streaming repair, Code View, and validated component fences through its `blocks` prop.

`markdown-math` and `markdown-shiki` are optional add-ons. The [Prose](https://ai.honestui.com/docs/prose) and [Markdown](https://ai.honestui.com/docs/components/markdown) docs cover installation, customization, and examples.

## How this repo is laid out

```
registry/ai/           the components, one file each
registry/lib/          installable utilities and optional Markdown add-ons
registry/styles/       standalone stylesheets
registry/examples/     the examples shown in the docs
content/docs/          the documentation pages
components/ui/         Honest UI components, as the CLI installs them
components/docs/       the documentation shell, shared with the Honest UI site
app/r/                 the registry served at /r/<name>.json
```

Components import Honest UI from `@/components/ui`, the same paths a project has after installing. The registry route turns those imports into links to the Honest UI registry.

## Development

You need Node.js 22.13.0 or newer and npm.

```bash
npm install
npm run dev
```

After adding or renaming an example, regenerate the preview index:

```bash
npm run registry:index
```

After editing `registry/styles/prose.css`, regenerate the Tailwind utilities:

```bash
npm run prose:generate
```

`verify:site` checks that both style formats stay in sync.

Check a change with:

```bash
npm run verify:site
npm run test:markdown
npm run test:e2e
```

Honest AI is available under the [MIT License](LICENSE).
