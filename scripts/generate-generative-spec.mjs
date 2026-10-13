import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
const root = process.cwd();
await mkdir(path.join(root, ".next/generative"), { recursive: true });
const outfile = path.join(root, ".next/generative/spec.mjs");
await build({
  stdin: {
    contents:
      'export { honestLibrary, honestChatLibrary, honestChatPromptOptions } from "./registry/generative";',
    resolveDir: root,
    loader: "ts",
  },
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
});
const { honestLibrary, honestChatLibrary, honestChatPromptOptions } =
  await import(pathToFileURL(outfile));
for (const [name, library, promptOptions] of [
  ["spec", honestLibrary, {}],
  // The chat spec carries its prompt options, so a prompt generated on the
  // server asks for the Markdown reply that GenerativeChat renders.
  ["chat-spec", honestChatLibrary, honestChatPromptOptions],
]) {
  const output =
    JSON.stringify(
      {
        ...library.toSpec(),
        ...promptOptions,
        schema: library.toJSONSchema(),
      },
      null,
      2,
    ) + "\n";
  const file = path.join(root, "registry/generative", name + ".json");
  if (process.argv.includes("--check")) {
    if ((await readFile(file, "utf8")) !== output)
      throw new Error(`Regenerate ${name}.json with npm run generative:spec`);
  } else await writeFile(file, output);
}
console.log("Generated matching server specs for the app and chat libraries.");
