import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  rewrites() {
    // Every documentation page is also served as Markdown at the same path plus `.md`.
    return [
      { source: "/docs.md", destination: "/llm" },
      { source: "/docs/:a.md", destination: "/llm/:a" },
      { source: "/docs/:a/:b.md", destination: "/llm/:a/:b" },
    ];
  },
};

export default createMDX()(nextConfig);
