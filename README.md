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

For optional app and playground configuration, copy the environment template:

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_APP_URL` to the app's URL. Local development uses Ollama at
`http://localhost:11434` and needs no API key. In production, setting the
server-only `OPENAI_API_KEY` enables `gpt-6-luna` with the OpenAI logo in the
model picker. Set `PLAYGROUND_OPENAI_CONTEXT_TOKENS` to enable its context meter.
OpenAI is the default when its key is configured. Set these values in your
deployment environment and redeploy; the key stays on the server.

The server-only `GEMINI_API_KEY` also enables hosted playground replies;
`PLAYGROUND_GEMINI_MODEL` optionally overrides the default model, and
`PLAYGROUND_GEMINI_CONTEXT_TOKENS` sets that model's context window in tokens,
which turns on that model's context meter. With both keys, visitors can switch
between OpenAI and Google. Requests use only the selected provider; failures
do not silently switch providers. Without either key,
the playground uses the visitor's local Ollama. Restart the app after changing
these values, and keep `.env.local` out of Git.

Get a `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).
The default is `gemini-3.8-flash`, which Google lists with free-tier input and
output in its [pricing documentation](https://ai.google.dev/gemini-api/docs/pricing).
Use a free-tier project to avoid paid API usage; setting a model here does not
control the project's billing tier. Free usage has quotas, and Google may use
free-tier content to improve its products.

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
