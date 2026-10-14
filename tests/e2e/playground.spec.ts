import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const OLLAMA = "http://localhost:11434";
const cors = { "access-control-allow-origin": "*" };

const reply = [
  "## Mocked reply",
  "",
  "Written in **Markdown** by the test transport.",
  "",
  "```honestai",
  "root = Stack([notice])",
  'notice = Callout("info", "Generated block", "Rendered from a generated program.")',
  "```",
  "",
  "Prose after the block.",
].join("\n");

/** Stands in for a local Ollama, so the suite needs no model. */
async function mockOllama(page: Page, responseText = reply) {
  await page.route(`${OLLAMA}/api/tags`, (route) =>
    route.fulfill({
      headers: cors,
      json: {
        models: [
          {
            name: "test-model:1b",
            details: { parameter_size: "1B" },
            capabilities: ["completion"],
          },
          { name: "embedder:latest", capabilities: ["embedding"] },
        ],
      },
    }),
  );
  await page.route(`${OLLAMA}/api/chat`, (route) =>
    route.fulfill({
      headers: { ...cors, "content-type": "application/x-ndjson" },
      body:
        [
          { message: { role: "assistant", content: responseText.slice(0, 40) } },
          { message: { role: "assistant", content: responseText.slice(40) } },
          { message: { role: "assistant", content: "" }, done: true },
        ]
          .map((chunk) => JSON.stringify(chunk))
          .join("\n") + "\n",
    }),
  );
}

test("sidebar button opens the playground from the Generative UI docs", async ({
  page,
}) => {
  await mockOllama(page);
  await page.goto("/docs/generative");
  const colors = await page.getByRole("link", { name: /^Playground/ }).evaluate(
    (element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, foreground: style.color };
    },
  );
  await page.getByRole("link", { name: /^Playground/ }).click();
  await page.mouse.move(0, 0);
  await expect(page).toHaveURL(/\/docs\/generative\/playground$/);
  await expect(page.getByRole("link", { name: /^Playground/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect.poll(async () =>
    page.getByRole("link", { name: /^Playground/ }).evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, foreground: style.color };
    }),
  ).toEqual(colors);
  await page.goto("/docs");
  const aiPlayground = page.getByRole("link", {
    name: "Playground Try AI components in chat",
  });
  await expect(aiPlayground).toBeVisible();
  await aiPlayground.click();
  await expect(page).toHaveURL(/\/docs\/generative\/playground$/);
});

test("sends the prompt to the chosen model and renders Markdown with its generated block", async ({
  page,
}) => {
  await mockOllama(page);
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  // The embedding-only model is not offered.
  await expect(
    playground.getByRole("button", { name: /Model:\s*test-model:1b/ }),
  ).toBeVisible();

  const request = page.waitForRequest(`${OLLAMA}/api/chat`);
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Say hello");
  await page.keyboard.press("Enter");

  const body = (await request).postDataJSON();
  expect(body.model).toBe("test-model:1b");
  expect(body.options.num_ctx).toBeGreaterThanOrEqual(16_384);
  expect(body.messages[0].role).toBe("system");
  expect(body.messages.at(-1)).toEqual({ role: "user", content: "Say hello" });

  // Prose is Markdown, and only the fenced block becomes components.
  const prose = playground.locator(".honest-prose");
  await expect(
    prose.getByRole("heading", { name: "Mocked reply" }),
  ).toBeVisible();
  await expect(prose.getByText("Prose after the block.")).toBeVisible();
  await expect(
    playground.getByText("Rendered from a generated program."),
  ).toBeVisible();
  await expect(playground.getByText("honestai")).toHaveCount(0);
  // Nothing frames the reply unless the model asks for a Card.
  await expect(playground.locator('[data-slot="card"]')).toHaveCount(0);
  await expect(playground.getByRole("textbox", { name: "Prompt" })).toHaveValue(
    "",
  );

  const axe = await new AxeBuilder({ page })
    .include('[data-slot="playground"]')
    .analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});

test("a reply can be copied and regenerated", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await mockOllama(page);
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Say hello");
  await page.keyboard.press("Enter");

  await playground.getByRole("button", { name: "Copy reply" }).click();
  await expect(playground.getByRole("status").getByText("Copied")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(reply);

  const request = page.waitForRequest(`${OLLAMA}/api/chat`);
  await playground.getByRole("button", { name: "Regenerate reply" }).click();
  // The same question is asked again, without the reply it replaces.
  expect((await request).postDataJSON().messages.slice(1)).toEqual([
    { role: "user", content: "Say hello" },
  ]);
  await expect(playground.locator('[data-role="user"]')).toHaveCount(1);
  await expect(playground.locator('[data-role="assistant"]')).toHaveCount(1);
  await expect(
    playground.getByText("Rendered from a generated program."),
  ).toBeVisible();
});

test("explains an unreachable Ollama and recovers on Check again", async ({
  page,
}) => {
  await page.route(`${OLLAMA}/**`, (route) => route.abort());
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await expect(playground.getByRole("alert")).toContainText(
    "Can’t reach Ollama at localhost:11434",
  );
  await expect(
    playground.getByRole("textbox", { name: "Prompt" }),
  ).toBeDisabled();

  await page.unroute(`${OLLAMA}/**`);
  await mockOllama(page);
  await playground.getByRole("button", { name: "Check again" }).click();
  await expect(playground.getByRole("alert")).toHaveCount(0);
  await expect(
    playground.getByRole("textbox", { name: "Prompt" }),
  ).toBeEnabled();
});

test("a failed reply reports Ollama's error and returns the message", async ({
  page,
}) => {
  await mockOllama(page);
  await page.route(`${OLLAMA}/api/chat`, (route) =>
    route.fulfill({
      status: 500,
      headers: cors,
      json: { error: "model failed to load" },
    }),
  );
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  const prompt = playground.getByRole("textbox", { name: "Prompt" });
  await prompt.fill("Say hello");
  await page.keyboard.press("Enter");
  await expect(playground.getByRole("alert")).toContainText(
    "model failed to load",
  );
  await expect(prompt).toHaveValue("Say hello");
});

test("overflowing conversations use the message rail and keep the composer fixed", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 650 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockOllama(page);
  const longReply = Array.from({ length: 30 }, (_, index) =>
    `Test paragraph ${index + 1}: Enough conversation content to exercise message navigation and scrolling.`,
  ).join("\n\n");
  await page.route(`${OLLAMA}/api/chat`, route => route.fulfill({
    headers: { ...cors, "content-type": "application/x-ndjson" },
    body: JSON.stringify({ message: { role: "assistant", content: longReply }, done: true }) + "\n",
  }));
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  const prompt = playground.getByRole("textbox", { name: "Prompt" });
  await prompt.fill("Read this conversation");
  await page.keyboard.press("Enter");
  await expect(playground.getByRole("button", { name: "Copy reply" })).toBeVisible();
  const viewport = playground.getByRole("region", { name: "Playground conversation" });
  const rail = playground.getByRole("navigation", { name: "Message navigation" });
  await expect(rail.getByRole("button")).toHaveCount(2);
  await expect(viewport).toHaveAttribute("tabindex", "0");
  await expect(viewport).toHaveCSS("scrollbar-width", "none");
  expect(await viewport.evaluate(node => getComputedStyle(node, "::-webkit-scrollbar").display)).toBe("none");
  const composerTop = (await prompt.boundingBox())!.y;
  await rail.getByRole("button", { name: "Go to user message 1 of 2" }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeLessThan(56);
  await expect(viewport.getByText("Read this conversation", { exact: true })).toBeVisible();
  await rail.getByRole("button", { name: "Go to assistant message 2 of 2" }).click();
  await expect.poll(() => viewport.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight)).toBeLessThan(2);
  expect((await prompt.boundingBox())!.y).toBe(composerTop);
  const axe = await new AxeBuilder({ page }).include('[data-slot="playground"]').analyze();
  expect(axe.violations.map(item => item.id)).toEqual([]);
});

test("generated dates use Honest UI calendars and submit single dates and ranges", async ({ page }) => {
  await mockOllama(page);
  const program = [
    "root = Stack([form])",
    'form = Form("goal", buttons, [target, period])',
    'buttons = Buttons([Button("Save dates", @ToAssistant("Save dates"))])',
    'target = FormControl("Target Date", DatePicker("targetDate", "single", null, "2026-10-12"))',
    'period = FormControl("Savings Period", DatePicker("period", "range", null, { from: "2026-10-12", to: "2026-10-15" }))',
  ].join("\n");
  await page.route(`${OLLAMA}/api/chat`, route => route.fulfill({
    headers: { ...cors, "content-type": "application/x-ndjson" },
    body: JSON.stringify({ message: { role: "assistant", content: program }, done: true }) + "\n",
  }));
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Choose dates");
  await page.keyboard.press("Enter");
  await expect(playground.locator('input[type="date"]')).toHaveCount(0);
  const target = playground.getByRole("button", { name: /^Target Date/ });
  await expect(target).toContainText("Oct 12, 2026");
  await target.focus();
  await page.keyboard.press("Enter");
  const calendar = page.locator('[data-slot="popover-content"][data-open]');
  await expect(calendar).toBeVisible();
  await expect(calendar).toHaveCSS("opacity", "1");
  const axe = await new AxeBuilder({ page }).include('[data-slot="popover-content"][data-open]').analyze();
  expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
  const day = calendar.getByRole("button", { name: /October 13.*2026/ });
  await day.focus();
  await page.keyboard.press("Enter");
  await expect(calendar).toBeHidden();
  await expect(target).toBeFocused();
  await expect(target).toContainText("Oct 13, 2026");
  await target.click();
  await calendar.getByRole("button", { name: "Clear date" }).click();
  await expect(target).toContainText("Select date");
  await target.click();
  await calendar.getByRole("button", { name: /October 13.*2026/ }).click();
  const range = playground.getByRole("button", { name: "Savings Period", exact: true });
  await expect(range).toContainText("Oct 12");
  await range.click();
  await expect(calendar).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(range).toBeFocused();
  await range.click();
  await calendar.getByRole("button", { name: /October 20.*2026/ }).click();
  await calendar.getByRole("button", { name: /October 22.*2026/ }).click();
  await expect(calendar).toBeHidden();
  const request = page.waitForRequest(`${OLLAMA}/api/chat`);
  await playground.getByRole("button", { name: "Save dates", exact: true }).click();
  const sent = (await request).postDataJSON().messages.at(-1).content;
  expect(sent).toContain('"targetDate":{"value":"2026-10-13"}');
  const submitted = JSON.parse(sent.slice(sent.indexOf("\n") + 1));
  expect(submitted.goal.period.value.from).toMatch(/^2026-10-20T/);
  expect(submitted.goal.period.value.to).toMatch(/^2026-10-22T/);
});

test("the wait is announced, then the meter shows the tokens Ollama counted", async ({
  page,
}) => {
  await mockOllama(page);
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(`${OLLAMA}/api/chat`, async (route) => {
    await held;
    await route.fulfill({
      headers: { ...cors, "content-type": "application/x-ndjson" },
      body:
        JSON.stringify({
          message: { role: "assistant", content: "Counted reply." },
          done: true,
          prompt_eval_count: 16_000,
          eval_count: 384,
        }) + "\n",
    });
  });
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  const meter = playground.locator('[data-slot="context-meter"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Count this");
  await page.keyboard.press("Enter");

  await expect(
    playground.locator('[data-slot="loading-state"]'),
  ).toContainText("Waiting for test-model:1b");
  // Nothing has been counted yet, so there is no figure to show.
  await expect(meter).toHaveCount(0);

  release();
  await expect(playground.getByText("Counted reply.")).toBeVisible();
  await expect(playground.locator('[data-slot="thinking-state"]')).toHaveCount(0);
  await expect(meter).toHaveAccessibleName("50% of context used");
  await meter.click();
  await expect(page.getByRole("meter")).toHaveAttribute(
    "aria-valuetext",
    "16,384 of 32,768 tokens",
  );

  await playground.getByRole("button", { name: "New chat" }).click();
  await expect(meter).toHaveCount(0);
});


test("submitted values stay readable on narrow screens and retain the model payload", async ({ page }) => {
  const quiz = [
    "Choose an answer.", "", "```honestai",
    "root = Stack([form])",
    'form = Form("quiz", Buttons([Button("Submit answers", @ToAssistant("Check my submitted answers"))]), [FormControl("What is 2 + 2?", RadioGroup("q1", [RadioItem("3", "", "3"), RadioItem("4", "", "4")]))])',
    "```",
  ].join("\n");
  await mockOllama(page, quiz);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt", exact: true }).fill("Give me a quiz");
  await page.keyboard.press("Enter");
  await playground.getByRole("radio", { name: "4", exact: true }).click();
  const outgoing = page.waitForRequest(`${OLLAMA}/api/chat`);
  await playground.getByRole("button", { name: "Submit answers", exact: true }).click();
  expect((await outgoing).postDataJSON().messages.at(-1).content).toBe(
    'Check my submitted answers\n{"quiz":{"q1":{"value":"4"}}}',
  );
  const submission = playground.locator('[data-slot="submitted-message"]');
  await expect(submission.locator("dt")).toHaveText("Q1");
  await expect(submission.locator("dd")).toHaveText("4");
  await expect(submission).not.toContainText('"value"');
  expect(await submission.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include('[data-slot="submitted-message"]').analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
  await submission.screenshot({ path: "/tmp/honest-submitted-message.png" });
});
