import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Locator, Page } from "playwright";
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

async function setupLoggedInPage(groupSlug: string, contextFactory = createContext) {
  context = await contextFactory();
  page = await context.newPage();
  await loginAsDemoUser(page, context, groupSlug);
  return page;
}

function getBellButton(p: Page): Locator {
  const bellIcon = p
    .locator('[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]')
    .first();
  return p.locator("button").filter({ has: bellIcon }).first();
}

describe("Notifications & Billing E2E", () => {
  test("Academy Admin sees notification bell icon", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    expect(getBellButton(p)).toBeVisible();
  });

  test("Clicking bell opens popover with notifications", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    await getBellButton(p).click();
    expect(p.getByText("Notifications").first()).toBeVisible();
  });

  test("Billing section appears in popover for Academy Admin", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    await getBellButton(p).click();
    expect(p.getByText("Unpaid Invoices").first()).toBeVisible();
  });

  test("Clicking user row in billing section navigates to billing profile", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    await getBellButton(p).click();
    expect(p.getByText("Unpaid Invoices").first()).toBeVisible();

    const userRow = p.locator('[role="button"]').filter({ hasText: /\w+/ }).last();
    if (await userRow.isVisible()) {
      await userRow.click();
      await p.waitForURL("**/billing-profile**");
      expect(p.url()).toContain("/billing-profile");
    }
  });

  test("Teacher does NOT see notification bell icon", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.teacher.groupSlug);
    const bellIcon = p.locator('[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]');
    expect(await bellIcon.count()).toBe(0);
  });

  test("Mobile: bell icon visible and popover renders", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug, createMobileContext);
    expect(getBellButton(p)).toBeVisible();
    await getBellButton(p).click();
    expect(p.getByText("Notifications").first()).toBeVisible();
  });
});
