export const installMethods = ["npm", "yarn", "bun", "pnpm", "shadcn"] as const;

export type InstallMethod = (typeof installMethods)[number];

/** Direct URLs remain available for registry clients such as shadcn. */
export const AI_REGISTRY_URL = "https://ai.honestui.com/r";

const AI_PREFIX = "@honestai/";

const honestUiCliCommands: Record<Exclude<InstallMethod, "shadcn">, string> = {
  npm: "npx honestui@latest add",
  yarn: "yarn dlx honestui@latest add",
  bun: "bunx --bun honestui@latest add",
  pnpm: "pnpm dlx honestui@latest add",
};

/**
 * Honest UI ships these items and resolves them by name. Other registry
 * clients still install Honest AI items from this site's URLs.
 */
export function getComponentInstallCommand(method: InstallMethod, items: string[]) {
  const targets = items.map((item) => {
    if (item.startsWith(AI_PREFIX)) {
      const name = item.slice(AI_PREFIX.length);
      return method === "shadcn" ? `${AI_REGISTRY_URL}/${name}.json` : name;
    }
    const name = item.replace(/^@honestui\//, "");
    return method === "shadcn" ? `@honestui/${name}` : name;
  });

  if (method === "shadcn") return `npx shadcn@latest add ${targets.join(" ")}`;
  return `${honestUiCliCommands[method]} ${targets.join(" ")}`;
}
