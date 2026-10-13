import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function playground(page: import("@playwright/test").Page) {
  await page.goto("/docs/generative");
  const preview = page.locator('[data-slot="generative-playground"]');
  await page
    .locator('[data-component-preview="generative-ui-demo"]')
    .scrollIntoViewIfNeeded();
  await expect(preview).toBeVisible();
  return preview;
}
test("library switcher follows navigation and browser history", async ({
  page,
}) => {
  await page.goto("/docs");
  await page.getByRole("button", { name: "Library: AI Components" }).click();
  await page.getByRole("menuitem", { name: /Generative UI/ }).click();
  await expect(page).toHaveURL(/\/docs\/generative$/);
  await expect(
    page.getByRole("button", { name: "Library: Generative UI" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Library: AI Components" }),
  ).toBeVisible();
});
test("generated form validates, keeps input and emits real form state", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Form", exact: true }).click();
  await preview.getByRole("button", { name: "Send", exact: true }).click();
  await expect(preview.getByRole("alert")).toBeVisible();
  await preview
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("connor@example.test");
  await preview.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    preview.getByText(
      "Action received locally. Nothing was submitted to a server.",
    ),
  ).toBeVisible();
  await expect(preview.locator("pre")).toContainText("connor@example.test");
  await expect(
    preview.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveValue("connor@example.test");
  const axe = await new AxeBuilder({ page })
    .include('[data-slot="generative-playground"]')
    .analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});
test("stream replay disables actions and restores them on stop", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Form", exact: true }).click();
  await preview.getByRole("button", { name: "Replay stream" }).click();
  await expect(
    preview.getByRole("button", { name: "Replay stream" }),
  ).toBeDisabled();
  await preview.getByRole("button", { name: "Stop replay" }).click();
  await expect(
    preview.getByRole("textbox", { name: "Email", exact: true }),
  ).toBeEnabled();
});
test("generated tabs support the keyboard and malformed output shows diagnostics", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Tabs", exact: true }).click();
  await preview.getByRole("tab", { name: "Summary" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(preview.getByRole("tab", { name: "Details" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(preview.getByRole("tab", { name: "Details" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await preview
    .getByRole("textbox", { name: "Honest AI Lang source" })
    .fill('root = Stack([MissingComponent("test")])');
  await expect(preview.getByRole("alert")).toContainText(/MissingComponent/);
});
test("local chat sends through the headless adapter and keeps thread history", async ({
  page,
}) => {
  await page.goto("/docs/generative/chat");
  await page
    .locator('[data-component-preview="generative-chat-demo"]')
    .scrollIntoViewIfNeeded();
  const preview = page.locator('[data-slot="generative-chat-demo"]');
  await expect(preview).toBeVisible();
  await preview
    .getByRole("textbox", { name: "Prompt", exact: true })
    .fill("Show my checklist");
  await preview.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    preview.getByText("You sent: Show my checklist", { exact: true }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "New conversation" }).click();
  await expect(preview.getByText("Send a message to start.")).toBeVisible();
  const history = preview.getByRole("combobox", {
    name: "Conversation history",
  });
  await history.click();
  await page.getByRole("option", { name: "Show my checklist", exact: true }).click();
  await expect(
    preview.getByText("You sent: Show my checklist", { exact: true }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include('[data-slot="generative-chat-demo"]')
    .analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});
test("registry bundles contain portable source and their dependencies", async ({
  request,
}) => {
  for (const name of [
    "generative-ui",
    "generative-chat",
    "generative-server",
  ]) {
    const response = await request.get(`/r/${name}.json`);
    expect(response.ok()).toBeTruthy();
    const item = await response.json();
    expect(item.files.length).toBeGreaterThan(5);
    expect(
      item.files.some((file: { path: string }) =>
        file.path.endsWith("LICENSE"),
      ),
    ).toBeTruthy();
    for (const file of item.files) {
      expect(file.target).toMatch(/^lib\/generative\//);
      expect(file.path).not.toMatch(/\.test\.|__tests__/);
      expect(file.content).not.toMatch(/https?:\/\/api\.thesys\.dev/);
      expect(file.content).not.toMatch(/from ["']@\/registry\//);
      expect(file.content).not.toMatch(/from ["']@\/components\/product\//);
    }
    expect(item.registryDependencies.length).toBeGreaterThan(0);
  }
});
test("editing a generated table changes only the selected row", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview
    .getByRole("textbox", { name: "Honest AI Lang source" })
    .fill(
      'root = Stack([table])\ntable = EditableTable("contacts", [{type: "text", key: "name", header: "Name"}], [{id: "one", values: ["First"]}, {id: "two", values: ["Second"]}])',
    );
  await preview.getByRole("cell", { name: "First", exact: true }).dblclick();
  const editor = preview.getByRole("textbox", { name: "Name", exact: true });
  await editor.fill("Updated");
  await editor.press("Enter");
  await expect(
    preview.getByRole("cell", { name: "Updated", exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole("cell", { name: "Second", exact: true }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "Save changes" }).click();
  await expect(preview.locator("pre")).toContainText("Updated");
  await expect(preview.locator("pre")).toContainText("Second");
});
test("generated charts render and narrow layouts remain operable", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Chart", exact: true }).click();
  await expect(
    preview.getByRole("img", { name: "BarChart", exact: true }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include('[data-slot="generative-playground"]')
    .analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  await preview.getByRole("button", { name: "Form", exact: true }).click();
  await expect(
    preview.getByRole("textbox", { name: "Email", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("chart styles preserve documentation spacing and table padding", async ({
  page,
}) => {
  for (const url of ["/docs", "/docs/generative/library"]) {
    await page.goto(url);
    const styles = await page.evaluate(() => ({
      cellPadding: parseFloat(
        getComputedStyle(document.querySelector("main th")!).paddingLeft,
      ),
      sectionSpacing: parseFloat(
        getComputedStyle(document.querySelector("main h2")!).marginTop,
      ),
    }));
    expect(styles.cellPadding).toBeGreaterThan(0);
    expect(styles.sectionSpacing).toBeGreaterThan(0);
  }
});

test("library switchers use compact shared sizing and generative navigation groups", async ({
  page,
}) => {
  for (const [url, name] of [
    ["/docs", "AI Components"],
    ["/docs/generative", "Generative UI"],
  ]) {
    await page.goto(url);
    const trigger = page.getByRole("button", { name: `Library: ${name}` });
    const metrics = await trigger.evaluate((button) => {
      const description = button.querySelector("span.text-muted-foreground")!;
      return {
        height: button.getBoundingClientRect().height,
        descriptionHeight: description.getBoundingClientRect().height,
        lineHeight: parseFloat(getComputedStyle(description).lineHeight),
      };
    });
    expect(metrics.height).toBe(48);
    expect(metrics.descriptionHeight).toBeLessThanOrEqual(
      metrics.lineHeight + 1,
    );
    const navigation = page.getByRole("navigation", {
      name: "Documentation",
      exact: true,
    });
    await expect(
      navigation.getByText("Get Started", { exact: true }),
    ).toBeVisible();
    await expect(
      navigation.getByText("Components", { exact: true }),
    ).toBeVisible();
    if (name === "Generative UI") {
      await expect(
        navigation.getByText("Documentation", { exact: true }),
      ).toBeVisible();
      await expect(
        navigation.getByRole("link", { name: "Overview", exact: true }),
      ).toHaveAttribute("href", "/docs/generative");
      await expect(
        navigation.getByRole("link", { name: "Renderer", exact: true }),
      ).toBeVisible();
      await expect(
        navigation.getByRole("link", { name: "Chat", exact: true }),
      ).toBeVisible();
    }
  }
});

test("documentation code uses Honest UI buttons and retains keyboard focus when expanding", async ({ page }) => {
  await page.goto("/docs/generative/renderer");
  const expand = page.locator('[data-slot="collapsible-trigger"]').filter({ hasText: /Expand|Collapse/ }).first();
  await expand.scrollIntoViewIfNeeded();
  await expect(expand).toHaveClass(/hui-color-background-neutral-secondary/);
  await expand.focus();
  await expand.press("Enter");
  await expect(expand).toHaveText("Collapse");
  await expect(expand).toBeFocused();
  await expand.press("Enter");
  await expect(expand).toHaveText("Expand");
  await expect(expand).toBeFocused();
});

test("generative examples save and restore local state", async ({ page }) => {
  await page.goto("/docs/generative/examples");
  const demo = page.locator('[data-slot="generative-state-demo"]');
  await page.locator('[data-component-preview="generative-state-demo"]').scrollIntoViewIfNeeded();
  await demo.getByRole("button", { name: "Add one", exact: true }).click();
  await expect(demo.getByText("Example packing count: 2", { exact: true })).toBeVisible();
  await demo.getByRole("button", { name: "Save snapshot" }).click();
  await demo.getByRole("button", { name: "Add one", exact: true }).click();
  await expect(demo.getByText("Example packing count: 3", { exact: true })).toBeVisible();
  await demo.getByRole("button", { name: "Restore snapshot" }).click();
  await expect(demo.getByText("Example packing count: 2", { exact: true })).toBeVisible();
});

test("generative query demo recovers without replacing its program", async ({ page }) => {
  await page.goto("/docs/generative/tools");
  await page.locator('[data-component-preview="generative-query-demo"]').scrollIntoViewIfNeeded();
  const demo = page.locator('[data-slot="generative-query-demo"]');
  await expect(demo.getByText("Example orders", { exact: true })).toBeVisible();
  await expect(demo.getByRole("status")).toHaveCount(0);
  await page.clock.install({ time: new Date(0) });
  await page.clock.pauseAt(new Date(1000));
  await demo.getByRole("button", { name: "Simulate query failure" }).click();
  await page.clock.runFor(100);
  await expect(demo.getByRole("status").filter({ hasText: "Loading local example data" })).toBeVisible();
  await page.clock.runFor(500);
  await expect(demo.getByRole("alert")).toContainText("example data query failed");
  await demo.getByRole("button", { name: "Retry data query" }).click();
  await page.clock.runFor(500);
  await expect(demo.getByRole("alert")).toHaveCount(0);
  await expect(demo.getByText("Example orders", { exact: true })).toBeVisible();
});

test("generative examples render custom Honest UI components and explain invalid source", async ({ page }) => {
  await page.goto("/docs/generative/examples");
  await page.locator('[data-component-preview="generative-custom-demo"]').scrollIntoViewIfNeeded();
  const custom = page.locator('[data-slot="generative-custom-demo"]');
  await expect(custom.getByText("Example shipment 1042")).toBeVisible();
  await expect(custom.locator('[data-slot="badge"]')).toHaveText("In transit");
  await page.locator('[data-component-preview="generative-diagnostics-demo"]').scrollIntoViewIfNeeded();
  const diagnostics = page.locator('[data-slot="generative-diagnostics-demo"]');
  await diagnostics.getByRole("button", { name: "Break component name" }).click();
  await expect(diagnostics.getByRole("alert")).toContainText("UnknownCard");
  await diagnostics.getByRole("button", { name: "Restore valid source" }).click();
  await expect(diagnostics.getByRole("alert")).toHaveCount(0);
  await expect(diagnostics.getByRole("status")).toContainText("passed local validation");
  const axe = await new AxeBuilder({ page }).include('[data-slot="generative-diagnostics-demo"]').analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});
