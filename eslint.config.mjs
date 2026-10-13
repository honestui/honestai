import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "lucide-react", message: 'Use "honestui/icons" instead.' }],
          patterns: [{ group: ["lucide-react/*"], message: 'Use "honestui/icons" instead.' }],
        },
      ],
    },
  },
  {
    files: ["registry/examples/**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Retain upstream runtime types and hook mechanics during the port; behavior
    // is covered by the imported regression suite. Adapters keep the site rules.
    files: ["registry/generative/runtime/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["registry/generative/catalog/**/schema.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    // Copied components also ship to non-Next applications.
    files: ["registry/generative/renderers/generated-component.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    // These upstream tests register render callbacks through defineComponent.
    files: ["registry/generative/runtime/**/*.test.{ts,tsx}"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  globalIgnores([".next/**", ".source/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
