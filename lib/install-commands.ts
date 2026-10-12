export const installMethods = ["npm", "yarn", "bun", "pnpm", "shadcn"] as const;

export type InstallMethod = (typeof installMethods)[number];

/** Where Honest AI serves its registry. The Honest UI CLI installs from it by URL. */
export const AI_REGISTRY_URL = "https://ai.honestui.com/r";

const AI_PREFIX = "@honestai/";

const honestUiCliCommands: Record<Exclude<InstallMethod, "shadcn">, string> = {
  npm: "npx honestui@latest add",
  yarn: "yarn dlx honestui@latest add",
  bun: "bunx --bun honestui@latest add",
  pnpm: "pnpm dlx honestui@latest add",
};

/**
 * Items written as `@honestai/name` come from this site's registry and are
 * installed by URL. Any other name is an Honest UI item, which the Honest UI
 * CLI resolves by name.
 */
export function getComponentInstallCommand(method: InstallMethod, items: string[]) {
  const targets = items.map((item) => {
    if (item.startsWith(AI_PREFIX)) return `${AI_REGISTRY_URL}/${item.slice(AI_PREFIX.length)}.json`;
    const name = item.replace(/^@honestui\//, "");
    return method === "shadcn" ? `@honestui/${name}` : name;
  });

  if (method === "shadcn") return `npx shadcn@latest add ${targets.join(" ")}`;
  return `${honestUiCliCommands[method]} ${targets.join(" ")}`;
}
