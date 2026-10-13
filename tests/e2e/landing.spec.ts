import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const questions = [
  "What is Honest AI?",
  "Does it call a model for me?",
  "Which components are there?",
  "How do I install a component?",
  "How does an agent ask before it acts?",
  "Can a model generate the interface itself?",
  "Can I restyle and translate the components?",
];

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("serves the written conversation at the root with its search metadata", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/");

    await expect(page).toHaveTitle("Honest AI, React Components for Agent and Chat Interfaces");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "React components for agent and chat interfaces",
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(questions);

    // The answers arrive in the server's HTML, not from a script.
    const html = (await response?.text()) ?? "";
    expect(html).toContain("None of them calls a model, streams a reply, or runs a tool.");
    expect(html).toContain('href="/docs/components/approval-card"');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  test("opens at the headline, and no sample takes focus or scrolls the page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({ ratio: 1 });
    await expect(page.locator("body")).toBeFocused();
  });

  test("the sample agent run waits for approval, then shows the tool calls and the change", async ({ page }) => {
    await page.goto("/");
    const run = page.locator("#what");

    const apply = run.getByRole("button", { name: "Apply the fix" });
    await expect(apply).toBeVisible({ timeout: 10_000 });
    // Nothing is edited before the person accepts.
    await expect(run.getByText("tool call")).toHaveCount(0);

    await apply.click();
    await expect(run.getByText("3 tool calls")).toBeVisible({ timeout: 10_000 });
    await expect(run.getByText("return roundTotal(rows.reduce(sum, 0))").last()).toBeVisible();
    await expect(run.getByRole("button", { name: "Run the sample again" })).toBeEnabled();
  });

  test("serves a preview image for links to the page", async ({ page, request }) => {
    await page.goto("/");
    const imageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(imageUrl).toBeTruthy();

    const image = await request.get(new URL(imageUrl!).pathname + new URL(imageUrl!).search);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toBe("image/png");
  });

  test("the documentation index no longer shares the home page's title", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveTitle("Documentation - Honest AI");
  });

  test("a typed question moves focus to the written answer it matches", async ({ page }) => {
    await page.goto("/");
    const prompt = page.getByRole("textbox", { name: "Ask a question about Honest AI" });

    await prompt.fill("how do I set this up with npm?");
    await prompt.press("Enter");

    const question = page.getByRole("heading", { name: "How do I install a component?" });
    await expect(question).toBeFocused();
    await expect(question).toBeInViewport();
    await expect(prompt).toHaveValue("");
    await expect(page).toHaveURL(/#install$/);
  });

  test("a question with no written answer says so and points to the documentation", async ({ page }) => {
    await page.goto("/");
    const prompt = page.getByRole("textbox", { name: "Ask a question about Honest AI" });

    await prompt.fill("zebra crossing");
    await prompt.press("Enter");

    const status = page.getByRole("status").filter({ hasText: "No written answer" });
    await expect(status).toContainText("“zebra crossing”");
    await expect(status).toContainText("no model runs on this page");
    await expect(status.getByRole("link", { name: "read the documentation" })).toHaveAttribute(
      "href",
      "/docs",
    );
    await expect(prompt).toBeFocused();
  });

  test("a link to an answer opens the page at that answer", async ({ page }) => {
    await page.goto("/#generative");

    await expect(
      page.getByRole("heading", { name: "Can a model generate the interface itself?" }),
    ).toBeInViewport({ ratio: 1 });
  });

  test("the rail beside the conversation scrolls to a message", async ({ page }) => {
    await page.goto("/");
    const rail = page.getByRole("navigation", { name: "Questions and answers" });
    await expect(rail.getByRole("button")).toHaveCount(questions.length * 2);

    const question = page.getByRole("heading", { name: "How does an agent ask before it acts?" });
    await expect(question).not.toBeInViewport();
    await rail.getByRole("button", { name: "Go to user message 9 of 14" }).click();
    await expect(question).toBeInViewport();
  });

  test("the rail is the only scroll control: no native scrollbar is drawn", async ({ page }) => {
    await page.goto("/");
    const conversation = page.getByRole("region", { name: "Conversation about Honest AI" });

    await expect(conversation).toHaveCSS("scrollbar-width", "none");
    const pageScrolls = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight,
    );
    expect(pageScrolls).toBe(false);
  });

  test("a short viewport pins nothing and scrolls as one page", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 480 });
    await page.goto("/");

    const pageScrolls = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight * 2,
    );
    expect(pageScrolls).toBe(true);
    await expect(page.getByRole("navigation", { name: "Questions and answers" }).getByRole("button")).toHaveCount(0);
  });
});

test("a question link replays its written answer: a wait, the streamed text, then the rest", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#install");

  await page
    .getByRole("navigation", { name: "Questions answered on this page" })
    .getByRole("link", { name: "Install" })
    .click();

  await expect(page).toHaveURL(/#install$/);
  await expect(page.getByRole("heading", { name: "How do I install a component?" })).toBeFocused();
  await expect(section.getByText("Finding the written answer").first()).toBeVisible();
  // The rest of the answer waits for the streamed paragraph.
  await expect(section.getByText("npx honestui@latest init")).toBeHidden();

  await expect(section.getByText("installs the packages they need.")).toBeVisible();
  await expect(section.getByText("npx honestui@latest init")).toBeVisible();
  await expect(section.getByText("Finding the written answer")).toHaveCount(0);
});
