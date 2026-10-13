import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const analyticsPreferenceStorageKey = "honest-ai.analytics-enabled.v1";

function isAnalyticsRequest(url: string) {
  return (
    url.includes("/_vercel/insights/") ||
    url.includes("va.vercel-scripts.com")
  );
}

async function stubAnalyticsEndpoints(page: Page) {
  await page.route("**/_vercel/insights/**", async (route) => {
    await route.fulfill({
      body: "window.va = window.va || function () {};",
      contentType: "application/javascript",
      status: 200,
    });
  });
  await page.route("https://va.vercel-scripts.com/**", async (route) => {
    await route.fulfill({
      body: "window.va = window.va || function () {};",
      contentType: "application/javascript",
      status: 200,
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, resetMarker }) => {
    if (window.sessionStorage.getItem(resetMarker)) {
      return;
    }

    window.localStorage.removeItem(key);
    window.sessionStorage.setItem(resetMarker, "true");
  }, {
    key: analyticsPreferenceStorageKey,
    resetMarker: "honest-ai-e2e-analytics-reset",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("aggregate analytics have no banner and can be disabled", async ({
  page,
}) => {
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (isAnalyticsRequest(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await stubAnalyticsEndpoints(page);

  await page.goto("/docs");
  await expect(
    page.getByRole("region", { name: "Optional analytics" }),
  ).toHaveCount(0);
  await expect
    .poll(() => analyticsRequests.length, { timeout: 5_000 })
    .toBeGreaterThan(0);

  await page.goto("/privacy");
  await expect(page.getByRole("status")).toHaveText(
    "Aggregate traffic analytics are enabled.",
  );
  await page.getByRole("button", { name: "Disable analytics" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Aggregate traffic analytics are disabled.",
  );
  await expect
    .poll(() =>
      page.evaluate(
        (key) => window.localStorage.getItem(key),
        analyticsPreferenceStorageKey,
      ),
    )
    .toBe("false");

  const requestCountBeforeReload = analyticsRequests.length;
  await page.reload();
  await page.waitForTimeout(250);
  expect(analyticsRequests).toHaveLength(requestCountBeforeReload);
});

test("browser privacy signals disable analytics automatically", async ({
  page,
}) => {
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (isAnalyticsRequest(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "doNotTrack", {
      configurable: true,
      value: "1",
    });
  });
  await stubAnalyticsEndpoints(page);

  await page.goto("/privacy");
  await expect(page.getByRole("status")).toHaveText(
    "Analytics are disabled because your browser sends a privacy signal.",
  );
  await expect(
    page.getByRole("button", { name: "Enable analytics" }),
  ).toBeDisabled();
  await page.waitForTimeout(250);
  expect(analyticsRequests).toEqual([]);
});

test("the privacy page has no detectable WCAG A or AA violations", async ({
  page,
}) => {
  await page.goto("/privacy");
  const results = await new AxeBuilder({ page })
    .withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22a",
      "wcag22aa",
    ])
    .analyze();

  expect(results.violations).toEqual([]);
});
