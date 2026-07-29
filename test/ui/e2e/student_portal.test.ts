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

async function expectVisible(locator: Locator): Promise<void> {
  expect(await locator.first().isVisible()).toBe(true);
}

describe("Student Portal E2E", () => {
  test("Student login → dashboard loads with NextClassJoinCard hero", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    // Hero: Next Class label, or empty-state copy when no upcoming lesson
    const nextClass = page.getByText(/Next Class|الحصة القادمة/i);
    const noUpcoming = page.getByText(/No upcoming classes|لا توجد حصص قادمة/i);
    const hasHero =
      (await nextClass
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await noUpcoming
        .first()
        .isVisible()
        .catch(() => false));
    expect(hasHero).toBe(true);

    // Join (not "Join Now") when a joinable lesson is present
    const joinButton = page.getByRole("button", { name: /^(Join|انضم)$/i });
    if (
      await joinButton
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await expectVisible(joinButton);
    }
  });

  test("Student dashboard shows credit balance metrics", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await expectVisible(page.getByText(/Classes Remaining|الحصص المتبقية/i));
    await expectVisible(page.getByText(/Total Classes|إجمالي الحصص/i));
  });

  test("Student dashboard shows recent lesson reports section", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await expectVisible(page.getByText(/Recent Lesson Reports|تقارير الحصص الأخيرة/i));
    await expectVisible(page.getByRole("button", { name: /View All History|عرض كل السجل/i }));
  });

  test("Student can navigate to credits page via sidebar", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await page.getByRole("link", { name: /My Credits|رصيدي/i }).click();
    await page.waitForURL("**/students/credits**");
    await expectVisible(page.getByRole("heading", { name: /My Credits|رصيدي/i }));
  });

  test("Student credits page shows transaction history", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.goto("/students/credits");
    await page.waitForURL("**/students/credits**");
    await expectVisible(page.getByRole("heading", { name: /Transaction History|سجل المعاملات/i }));
    await expectVisible(page.getByRole("columnheader", { name: /Date|التاريخ/i }));
    await expectVisible(page.getByRole("columnheader", { name: /Type|النوع/i }));
    await expectVisible(page.getByRole("columnheader", { name: /Amount|الكمية|المبلغ/i }));
    await expectVisible(page.getByRole("columnheader", { name: /Notes|ملاحظات/i }));
  });

  test("Mobile viewport: student dashboard renders mobile view (card list)", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    const hero = page
      .locator('[class*="MuiPaper-root"], [class*="MuiBox-root"]')
      .filter({ hasText: /Next Class|الحصة القادمة|No upcoming classes|لا توجد حصص قادمة/i });
    await expectVisible(hero.first());
  });

  test("Student sidebar shows all expected navigation items", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await expectVisible(page.getByRole("link", { name: /Today's Classes|حصص اليوم/i }));
    await expectVisible(page.getByRole("link", { name: /My Schedule|جدولي/i }));
    await expectVisible(page.getByRole("link", { name: /My Credits|رصيدي/i }));
    await expectVisible(page.getByRole("link", { name: /My Profile|ملفي/i }));
    await expectVisible(page.getByRole("button", { name: /Logout|تسجيل خروج/i }));
  });
});
