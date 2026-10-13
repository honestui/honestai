import type { MetadataRoute } from "next";

import { source } from "@/lib/source";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
      changeFrequency: "weekly" as const,
      priority: page.url === "/docs" ? 1 : 0.8,
    })),
    {
      url: absoluteUrl("/privacy"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
