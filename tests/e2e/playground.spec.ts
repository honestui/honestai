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

test("code in replies is highlighted, in Markdown fences and generated code blocks", async ({
  page,
}) => {
  await mockOllama(
    page,
    [
      "A Java loop:",
      "",
      "```java",
      "for (int i = 0; i < 5; i++) {",
      "    System.out.println(i);",
      "}",
      "```",
      "",
      "```honestai",
      'root = CodeBlock("cpp", "int main() { return 0; }")',
      "```",
    ].join("\n"),
  );
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("explain for loops in java");
  await page.keyboard.press("Enter");

  const blocks = playground.locator('[data-slot="prose-code-block"]');
  await expect(blocks).toHaveCount(2);
  const java = blocks.filter({ hasText: "System.out" });
  const cpp = blocks.filter({ hasText: "int main" });
  // Languages show as people write them.
  await expect(java.locator("figcaption")).toContainText("Java");
  await expect(cpp.locator("figcaption")).toContainText("C++");
  await expect(java.locator(".prose-syntax-keyword", { hasText: "for" })).toBeVisible();
  await expect(java.locator(".prose-syntax-constant", { hasText: "5" })).toBeVisible();
  await expect(cpp.locator(".prose-syntax-type", { hasText: "int" }).or(cpp.locator(".prose-syntax-keyword", { hasText: "int" })).first()).toBeVisible();
  await expect(cpp.locator(".prose-syntax-function", { hasText: "main" })).toBeVisible();
  // Highlighting must not change the text people copy.
  await expect(java.locator("pre")).toContainText("System.out.println(i);");
});

test("a Diagram sits side by side when there is room and stacks when there is not", async ({ page }) => {
  await mockOllama(page, [
    "A pointer holds an address.",
    "",
    "```honestai",
    "root = Stack([diagram])",
    'diagram = Diagram([pointer, target], ["points to"], "Example addresses for illustration")',
    'pointer = DiagramNode("Pointer p", "0x100", "Holds the address of x")',
    'target = DiagramNode("Variable x", "10", "Stored at address 0x100")',
    "```",
  ].join("\n"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Explain pointers in C");
  await page.keyboard.press("Enter");
  const figure = playground.locator("figure");
  await expect(figure.locator("figcaption")).toHaveText("Example addresses for illustration");
  const boxes = figure.locator("ol > li:not([aria-hidden])");
  await expect(boxes).toHaveCount(2);
  const top = async (index: number) => (await boxes.nth(index).boundingBox())!.y;
  expect(Math.abs((await top(0)) - (await top(1)))).toBeLessThan(1);
  const axe = await new AxeBuilder({ page }).include('[data-slot="playground"] figure').analyze();
  expect(axe.violations.map(item => item.id)).toEqual([]);

  await page.setViewportSize({ width: 360, height: 800 });
  await expect.poll(async () => (await top(1)) - (await top(0))).toBeGreaterThan(40);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("a Calculator recomputes from the keyboard and withholds results while an input is incomplete", async ({ page }) => {
  await mockOllama(page, [
    "Adjust the inputs to see the result update.",
    "",
    "```honestai",
    "root = Stack([calc, growth])",
    "$monthly = [300]",
    '$years = "10"',
    'calc = Calculator([fcMonthly, fcYears], [saved], "Saved = monthly deposit × 12 × years, with no interest.")',
    'fcMonthly = FormControl("Monthly deposit ($)", Slider("monthly", "continuous", 50, 2000, 50, [300], "Monthly deposit", null, $monthly))',
    'fcYears = FormControl("Years", Input("years", "10", "number", { required: true, min: 1 }, $years))',
    'saved = Result("Saved", $monthly * 12 * $years, "currency")',
    'growth = BarChart(@Each(@Range(1, $years), "y", "Year " + y), [Series("Saved ($)", @Each(@Range(1, $years), "y", $monthly * 12 * y))])',
    "```",
  ].join("\n"));
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("How much will I save?");
  await page.keyboard.press("Enter");
  const result = playground.locator("dl dd").first();
  await expect(result).toHaveText("$36,000");
  await expect(playground.locator(".recharts-wrapper, [data-chart]").first()).toBeVisible();

  const slider = playground.getByRole("slider", { name: "Monthly deposit ($)" });
  await slider.focus();
  for (let step = 0; step < 4; step++) await page.keyboard.press("ArrowRight");
  await expect(result).toHaveText("$60,000");

  // A pointer drag reports a bare number; the thumb must survive it.
  const track = (await playground.locator('[data-slot="slider-control"]').boundingBox())!;
  await page.mouse.move(track.x + track.width * 0.25, track.y + track.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width * 0.6, track.y + track.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(playground.locator('[data-slot="slider-thumb"]')).toHaveCount(1);
  await expect(result).not.toHaveText("$60,000");

  const axe = await new AxeBuilder({ page }).include('[data-slot="playground"]').analyze();
  expect(axe.violations.map(item => item.id)).toEqual([]);

  await playground.getByRole("spinbutton", { name: "Years" }).fill("");
  await expect(result).toHaveText("—");
  await expect(playground.getByText("Complete the inputs to see this result.")).toBeVisible();
  await expect(playground.getByText("This field is required")).toBeVisible();
});

test("a Map numbers the stops it finds and keeps every place in a list", async ({ page }) => {
  await mockOllama(page, [
    "Here are the stops in order.",
    "",
    "```honestai",
    "root = Stack([trip])",
    'trip = Map([denver, moab, nowhere], "route", "Stops in order. No roads are drawn.")',
    'denver = MapPlace("Denver", "Denver, Colorado, USA")',
    'moab = MapPlace("Moab", "Moab, Utah, USA", "Overnight")',
    'nowhere = MapPlace("Lost Lake", "Lost Lake, Nowhere")',
    "```",
  ].join("\n"));
  const found: Record<string, [number, number, string]> = {
    "Denver, Colorado, USA": [39.7392, -104.9903, "Denver, Colorado, United States"],
    "Moab, Utah, USA": [38.5733, -109.5498, "Moab, Grand County, Utah, United States"],
  };
  // No third-party traffic in tests: places and the style are local stand-ins.
  await page.route("**/api/playground/geocode", async (route) => {
    const place = found[JSON.parse(route.request().postData()!).query];
    await route.fulfill({ json: { place: place ? { lat: place[0], lon: place[1], label: place[2] } : null } });
  });
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({
      json: { version: 8, sources: {}, layers: [{ id: "land", type: "background", paint: { "background-color": "#e9e9e6" } }] },
    }),
  );
  // A stand-in imagery tile, so the satellite view needs no outside server.
  const tile = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.route("https://basemap.nationalmap.gov/**", (route) =>
    route.fulfill({ contentType: "image/png", body: tile }),
  );
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Plan a trip");
  await page.keyboard.press("Enter");

  const map = playground.getByRole("region", { name: "Map of 2 places. The same places are listed below." });
  await expect(map.locator("canvas")).toBeVisible();
  await expect(map.locator(".maplibregl-marker")).toHaveText(["1", "2"]);
  const stops = playground.locator("figure ol > li");
  await expect(stops).toHaveCount(3);
  await expect(stops.nth(1)).toContainText("Matched: Moab, Grand County, Utah, United States");
  await expect(stops.nth(2)).toContainText("Not found, so it isn't on the map.");
  await expect(map.getByRole("button", { name: "Zoom in" })).toBeVisible();

  // Imagery covers every place, so the map opens on it, and the reader can switch.
  const satellite = playground.getByRole("button", { name: "Satellite" });
  await expect(satellite).toHaveAttribute("aria-pressed", "true");
  await playground.getByRole("button", { name: "Map", exact: true }).click();
  await expect(playground.getByRole("button", { name: "Map", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(satellite).toHaveAttribute("aria-pressed", "false");

  const axe = await new AxeBuilder({ page }).include('[data-slot="playground"] figure').analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});

test("a Quiz is answered from the keyboard, one question at a time, and scored on submit", async ({ page }) => {
  await mockOllama(page, [
    "```honestai",
    "root = Stack([quiz])",
    "quiz = Quiz([q1, q2])",
    'q1 = QuizQuestion("What is 2 + 2?", ["3", "4", "5"], "4", "Two pairs make four.")',
    'q2 = QuizQuestion("What is 3 × 3?", ["6", "9"], "9")',
    "```",
  ].join("\n"));
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Quiz me");
  await page.keyboard.press("Enter");

  await playground.getByRole("radio", { name: "3" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(playground.getByRole("radio", { name: "4" })).toBeChecked();
  // Nothing is marked until the end.
  await expect(playground.getByText("Correct.")).toHaveCount(0);
  let axe = await new AxeBuilder({ page }).include('[data-slot="playground"]').analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);

  await playground.getByRole("button", { name: "Next" }).click();
  await expect(playground.getByRole("heading", { name: /Question 2 of 2/ })).toBeFocused();
  await playground.getByRole("radio", { name: "6" }).click();
  await playground.getByRole("button", { name: "Submit answers" }).click();
  await expect(playground.getByRole("heading", { name: "1 of 2 correct" })).toBeFocused();
  await expect(playground.locator("p", { hasText: "Correct. Two pairs make four." })).toBeVisible();
  await expect(playground.locator("p", { hasText: "Not quite. The answer is 9." })).toBeVisible();
  axe = await new AxeBuilder({ page }).include('[data-slot="playground"]').analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});

test("a PartsDiagram row is one bar when wide and lines when narrow", async ({ page }) => {
  await mockOllama(page, [
    "```honestai",
    "root = Stack([url])",
    'url = PartsDiagram([DiagramPart("Scheme", "https://"), DiagramPart("Host", "example.com", null, 2), DiagramPart("Path", "/docs")], "row")',
    "```",
  ].join("\n"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/docs/generative/playground");
  const playground = page.locator('[data-slot="playground"]');
  await playground.getByRole("textbox", { name: "Prompt" }).fill("Parts of a URL");
  await page.keyboard.press("Enter");
  const parts = playground.locator("figure ol > li");
  await expect(parts).toHaveCount(3);
  const top = async (index: number) => (await parts.nth(index).boundingBox())!.y;
  expect(Math.abs((await top(0)) - (await top(2)))).toBeLessThan(1);
  await page.setViewportSize({ width: 360, height: 800 });
  await expect.poll(async () => (await top(1)) - (await top(0))).toBeGreaterThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
