import type { MetadataRoute } from "next";

import { source } from "@/lib/source";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: "2026-10-12",
    },
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
      ...(page.data.lastModified && { lastModified: page.data.lastModified }),
    })),
    {
      url: absoluteUrl("/docs/generative/playground"),
      lastModified: "2026-10-13",
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: "2026-10-12",
    },
  ];
}
