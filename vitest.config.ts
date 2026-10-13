import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: [
      "tests/generative/**/*.test.{ts,tsx}",
      "registry/generative/runtime/**/*.test.{ts,tsx}",
    ],
    environment: "node",
    globals: false,
  },
});
