import { expect, test } from "@playwright/test";

const docs = [
  ["/docs", "Documentation - Honest AI"],
  ["/docs/components/prompt-bar", "React Prompt Input with Attachments and Model Selection - Honest AI"],
  ["/docs/components/approval-card", "React Approval Card for Agent Decisions - Honest AI"],
] as const;

for (const [path, title] of docs) {
  test(`${path} exposes metadata and structured data without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(title);
      await expect(page.locator("h1")).toHaveCount(1);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical!).pathname).toBe(path);
      await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(0);

      const schema = JSON.parse(await page.locator('script#docs-jsonld').textContent() ?? "{}");
      const article = schema["@graph"].find((item: { "@type": string }) => item["@type"] === "TechArticle");
      expect(article.url).toBe(canonical);
      expect(article.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const breadcrumb = schema["@graph"].find((item: { "@type": string }) => item["@type"] === "BreadcrumbList");
      expect(breadcrumb.itemListElement.at(-1).item).toBe(article.url);

      const sitemap = await (await context.request.get("/sitemap.xml")).text();
      expect(sitemap).toContain(`<loc>${article.url}</loc>\n<lastmod>${article.dateModified}</lastmod>`);
    } finally {
      await context.close();
    }
  });
}

test("sitemap includes the playground and dated canonical pages", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls.map((url) => new URL(url).pathname)).toContain("/docs/generative/playground");
  expect(new Set(urls).size).toBe(urls.length);
  expect(xml.match(/<lastmod>/g)?.length).toBe(urls.length);
  expect(xml).not.toMatch(/<priority>|<changefreq>/);

  const markdown = await request.get("/docs/components/prompt-bar.md");
  expect(markdown.headers()["x-robots-tag"]).toBe("noindex");
  const missing = await request.get("/seo-nonexistent-page");
  expect(missing.status()).toBe(404);
});

test("compact highlighted source keeps readable colors in both themes", async ({ page }) => {
  await page.goto("/docs/components/prompt-bar");
  await page.getByRole("tab", { name: "Code", exact: true }).first().click();
  const token = page.locator('[data-rehype-pretty-code-figure] span[class*="__shiki_"]').filter({ hasText: "import" }).first();
  await expect(token).toHaveCount(1);
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((value) => {
      document.documentElement.classList.toggle("dark", value === "dark");
      document.documentElement.dataset.theme = value;
    }, theme);
    const colors = await token.evaluate((node, value) => {
      const computed = getComputedStyle(node);
      const expectedColor = computed.getPropertyValue(`--shiki-${value}`).trim();
      const probe = document.createElement("span");
      probe.style.color = expectedColor;
      node.appendChild(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return { actual: computed.color, expected, expectedColor };
    }, theme);
    expect(colors.expectedColor).not.toBe("");
    expect(colors.actual).toBe(colors.expected);
  }
});
