import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The site has no landing page yet, so the root opens the documentation.
      { source: "/", destination: "/docs", permanent: false },
    ];
  },
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
