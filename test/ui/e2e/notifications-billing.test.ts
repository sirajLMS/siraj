import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Locator, Page } from "playwright";
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

async function setupLoggedInPage(groupSlug: string, contextFactory = createContext) {
  context = await contextFactory();
  page = await context.newPage();
  await loginAsDemoUser(page, context, groupSlug);
  return page;
}

function getBellButton(p: Page): Locator {
  // The NotificationButton wraps NotificationsOutlined icon in NavbarIcon
  // (IconButton with aria-label="Notifications" / "الإشعارات").
  // In dev mode MUI icons get data-testid="${displayName}Icon".
  return p.locator('button[aria-label="Notifications"], button[aria-label="الإشعارات"]').first();
}

describe("Notifications & Billing E2E", () => {
  test("Admin sees notification bell icon", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    expect(await getBellButton(p).isVisible()).toBe(true);
  });

  test("Clicking bell opens popover with notifications", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    await getBellButton(p).click();
    // Drawer title: "Notifications" (en) / "الإشعارات" (ar)
    const drawerTitle = p.getByText(/Notifications|الإشعارات/).first();
    await drawerTitle.waitFor({ state: "visible" });
    expect(await drawerTitle.isVisible()).toBe(true);
  });

  test.skip("Billing section appears in popover for Admin", async () => {
    // SKIP: billing UI is not yet implemented behind the notifications drawer;
    // re-enable once the "Unpaid Invoices" section ships.
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    await getBellButton(p).click();
    // Section title: "Unpaid Invoices" (en) / "الفواتير غير المدفوعة" (ar)
    const billingTitle = p.getByText(/Unpaid Invoices|الفواتير غير المدفوعة/).first();
    await billingTitle.waitFor({ state: "visible" });
    expect(await billingTitle.isVisible()).toBe(true);
  });

  test.skip("Clicking user row in billing section navigates to billing profile", async () => {
    // SKIP: blocked on the billing-in-notifications feature (see test above);
    // re-enable once the billing section is reachable from the popover.
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug);
    await getBellButton(p).click();
    const billingTitle = p.getByText(/Unpaid Invoices|الفواتير غير المدفوعة/).first();
    await billingTitle.waitFor({ state: "visible" });

    const userRow = p.locator('[role="button"]').filter({ hasText: /\w+/ }).last();
    if (await userRow.isVisible()) {
      await userRow.click();
      await p.waitForURL("**/billing-profile**");
      expect(p.url()).toContain("/billing-profile");
    }
  });

  test("Teacher does NOT see notification bell icon", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.teacher.groupSlug);
    const bellIcon = p.locator('button[aria-label="Notifications"], button[aria-label="الإشعارات"]');
    expect(await bellIcon.count()).toBe(0);
  });

  test("Mobile: bell icon visible and popover renders", async () => {
    const p = await setupLoggedInPage(DEMO_USERS.academyAdmin.groupSlug, createMobileContext);
    expect(await getBellButton(p).isVisible()).toBe(true);
    await getBellButton(p).click();
    const drawerTitle = p.getByText(/Notifications|الإشعارات/).first();
    await drawerTitle.waitFor({ state: "visible" });
    expect(await drawerTitle.isVisible()).toBe(true);
  });
});
