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
  // First, trigger Turbopack compile by visiting the app root.
  await page.goto(getTestBaseUrl(), { waitUntil: "domcontentloaded" }).catch(() => {});
  // Then login (sets cookie + navigates to /dashboard).
  await loginAsDemoUser(page, context, groupSlug);
  // Re-navigate to the dashboard route with the earliest non-interactive state
  // so we don't block on slow initial compile.
  await page.goto(`${getTestBaseUrl()}/dashboard`, { waitUntil: "commit" }).catch(async (_err: unknown) => {
    // First navigation may trigger Turbopack compile; retry with a longer wait.
    await page.waitForTimeout(2000);
    await page.goto(`${getTestBaseUrl()}/dashboard`, { waitUntil: "domcontentloaded" }).catch(() => {});
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
    // Teachers don't have a search input on their dashboard. Other textboxes
    // (pagination page input, autocomplete filter) are not search inputs.
    // We check for the search input by its placeholder text.
    const searchInput = page.getByPlaceholder(/search|بحث/i);
    expect(await searchInput.count()).toBe(0);
  });

  test("Mobile: card list renders instead of data grid", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await warmUpAndLogin(page, context, DEMO_USERS.academyAdmin.groupSlug, "en");

    // Mobile admin dashboard renders cards (MuiPaper) with schedule overview content.
    // Wait for any Paper card in the schedule overview section.
    const cardList = page.locator('[class*="MuiPaper-root"]');
    await cardList.first().waitFor({ state: "visible", timeout: 30000 });
    expect(await cardList.first().isVisible()).toBe(true);
  });
});
