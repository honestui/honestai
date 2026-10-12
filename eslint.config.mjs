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
  globalIgnores([".next/**", ".source/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
