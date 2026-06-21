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

describe("Notifications & Billing E2E", () => {
  test("Academy Admin sees notification bell icon", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const bellIcon = page
      .locator('[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]')
      .first();
    const bellButton = page.locator("button").filter({ has: bellIcon }).first();

    await expect(bellButton).toBeVisible();
  });

  test("Clicking bell opens popover with notifications", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const bellIcon = page
      .locator('[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]')
      .first();
    const bellButton = page.locator("button").filter({ has: bellIcon }).first();
    await bellButton.click();

    await expect(page.getByText("Notifications").first()).toBeVisible();
  });

  test("Billing section appears in popover for Academy Admin", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const bellIcon = page
      .locator('[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]')
      .first();
    const bellButton = page.locator("button").filter({ has: bellIcon }).first();
    await bellButton.click();

    const billingHeader = page.getByText("Unpaid Invoices").first();
    await expect(billingHeader).toBeVisible();
  });

  test("Clicking user row in billing section navigates to billing profile", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const bellIcon = page
      .locator('[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]')
      .first();
    const bellButton = page.locator("button").filter({ has: bellIcon }).first();
    await bellButton.click();

    const billingHeader = page.getByText("Unpaid Invoices").first();
    await expect(billingHeader).toBeVisible();

    const userRow = page.locator('[role="button"]').filter({ hasText: /\w+/ }).last();
    if (await userRow.isVisible()) {
      await userRow.click();
      await page.waitForURL("**/billing-profile**");
      expect(page.url()).toContain("/billing-profile");
    }
  });

  test("Teacher does NOT see notification bell icon", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.teacher.groupSlug);

    const bellIcon = page.locator(
      '[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]'
    );
    const count = await bellIcon.count();
    expect(count).toBe(0);
  });

  test("Mobile: bell icon visible and popover renders", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const bellIcon = page
      .locator('[data-testid="NotificationsOutlinedIcon"], svg[data-testid="NotificationsOutlined"]')
      .first();
    const bellButton = page.locator("button").filter({ has: bellIcon }).first();

    await expect(bellButton).toBeVisible();

    await bellButton.click();
    await expect(page.getByText("Notifications").first()).toBeVisible();
  });
});
