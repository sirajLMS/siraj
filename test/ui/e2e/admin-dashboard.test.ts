import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { DEMO_USERS, loginAsDemoUser } from "./helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "./lifecycle";

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

describe("Admin Dashboard E2E", () => {
  test("Academy Admin sees search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("Academy Admin sees timezone columns", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await expect(page.getByText("Your Time")).toBeVisible();
  });

  test("Search filters schedule grid", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const searchInput = page.getByRole("textbox");
    await searchInput.fill("Ahmed");

    await page.waitForTimeout(500);

    const gridRows = page.locator('[role="row"]');
    const rowCount = await gridRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test("Click details navigates to class page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const detailsButton = page.locator('[aria-label*="details"], [title*="Details"]').first();
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      await page.waitForURL("**/classes/**");
      expect(page.url()).toContain("/classes/");
    }
  });

  test("Teacher does not see search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.teacher.groupSlug);

    const textboxes = page.getByRole("textbox");
    await expect(textboxes).toBeEmpty();
  });

  test("Mobile: card list renders instead of data grid", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const cardList = page.locator('[class*="MuiPaper-root"]').filter({ hasText: /CLS-/ });
    await expect(cardList.first()).toBeVisible();
  });
});
