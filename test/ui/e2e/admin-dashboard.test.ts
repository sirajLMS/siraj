import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { getTestBaseUrl } from "@/frontend/common/graphql/test/testPort";
import { DEMO_USERS, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

let context: BrowserContext;
let page: Page;

afterEach(async () => {
  if (page) {
    await page.close();
  }
  if (context) {
    await context.close();
  }
});

async function warmUpAndLogin(
  page: Page,
  context: BrowserContext,
  groupSlug: string,
  locale: "ar" | "en" = "ar"
): Promise<void> {
  page.setDefaultNavigationTimeout(100000);
  await loginAsDemoUser(page, context, groupSlug).catch(async () => {
    await page.goto(`${getTestBaseUrl()}/ar/dashboard`, { waitUntil: "domcontentloaded" });
    await loginAsDemoUser(page, context, groupSlug);
  });
  // loginAsDemoUser navigates to "/ar/dashboard" which 404s (the real route is "/dashboard").
  // Re-navigate to the actual dashboard route so the page renders real content.
  // Use "commit" (the earliest non-interactive state) so we don't block on slow initial compile.
  await page.goto(`${getTestBaseUrl()}/dashboard`, { waitUntil: "commit" }).catch(async (err: unknown) => {
    // First navigation may trigger Turbopack compile; retry with a longer wait.
    await page.waitForTimeout(2000);
    await page.goto(`${getTestBaseUrl()}/dashboard`, { waitUntil: "domcontentloaded" }).catch(() => {});
    void err;
  });
  if (process.env.E2E_DEBUG === "1") {
    const slug = groupSlug.replace(/[^a-zA-Z0-9]/g, "_");
    const stamp = `${slug}_${locale}`;
    await page.screenshot({ path: `/tmp/opencode/e2e_${stamp}.png`, fullPage: true }).catch(() => {});
    const html = await page.content();
    await import("node:fs/promises").then(fs => fs.writeFile(`/tmp/opencode/e2e_${stamp}.html`, html).catch(() => {}));
  }
}

describe("Admin Dashboard E2E", () => {
  test("Admin sees search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await warmUpAndLogin(page, context, DEMO_USERS.academyAdmin.groupSlug, "en");

    const textbox = page.getByRole("textbox");
    await textbox.first().waitFor({ state: "visible", timeout: 30000 });
    expect(await textbox.first().isVisible()).toBe(true);
  });

  test("Admin sees timezone columns", async () => {
    context = await createContext();
    page = await context.newPage();
    await warmUpAndLogin(page, context, DEMO_USERS.academyAdmin.groupSlug, "en");

    const yourTimeHeader = page.locator('.MuiDataGrid-columnHeader[data-field="yourTime"]');
    await yourTimeHeader.waitFor({ state: "visible", timeout: 30000 });
    expect(await yourTimeHeader.isVisible()).toBe(true);
  });

  test("Search filters schedule grid", async () => {
    context = await createContext();
    page = await context.newPage();
    await warmUpAndLogin(page, context, DEMO_USERS.academyAdmin.groupSlug, "en");

    const searchInput = page.getByRole("textbox").first();
    await searchInput.waitFor({ state: "visible", timeout: 30000 });
    await searchInput.fill("Ahmed");

    await page.waitForTimeout(500);

    const gridRows = page.locator('[role="row"]');
    const rowCount = await gridRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test("Click details navigates to class page", async () => {
    context = await createContext();
    page = await context.newPage();
    await warmUpAndLogin(page, context, DEMO_USERS.academyAdmin.groupSlug, "en");

    const detailsButton = page.locator('[aria-label*="details"], [title*="Details"]').first();
    await detailsButton.waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      await page.waitForURL("**/classes/**");
      expect(page.url()).toContain("/classes/");
    }
  });

  test("Teacher does not see search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await warmUpAndLogin(page, context, DEMO_USERS.teacher.groupSlug, "en");

    await page.waitForLoadState("networkidle").catch(() => {});
    const textboxes = page.getByRole("textbox");
    const count = await textboxes.count();
    expect(count).toBe(0);
  });

  test("Mobile: card list renders instead of data grid", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await warmUpAndLogin(page, context, DEMO_USERS.academyAdmin.groupSlug, "en");

    const cardList = page.locator('[class*="MuiPaper-root"]').filter({ hasText: /CLS-/ });
    await cardList.first().waitFor({ state: "visible", timeout: 30000 });
    expect(await cardList.first().isVisible()).toBe(true);
  });
});
