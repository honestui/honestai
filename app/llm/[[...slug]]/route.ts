import { processMdxForLLMs } from "@/lib/llm";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";

export const dynamic = "force-static";
export const revalidate = false;

// Markdown copies exist for tools and for the Copy Page button. The HTML page is the one to index.
const markdownHeaders = {
  "content-type": "text/markdown; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex",
};

export function generateStaticParams() {
  return source.generateParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return new Response(
      `# 404: Documentation page not found

No Honest AI documentation page exists at this URL.

- [Documentation index](${absoluteUrl("/docs.md")})
- [XML sitemap](${absoluteUrl("/sitemap.xml")})
`,
      { status: 404, headers: markdownHeaders },
    );
  }

  const processed = await page.data.getText("processed");
  const description = page.data.description ? `\n\n> ${page.data.description}` : "";
  const markdown = `# ${page.data.title}${description}

Source: ${absoluteUrl(page.url)}

${processMdxForLLMs(processed).trim()}
`;

  return new Response(markdown, { headers: markdownHeaders });
}
