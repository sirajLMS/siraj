import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
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

describe("Student Portal E2E", () => {
  test("Student login → dashboard loads with NextClassJoinCard hero", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/ar/dashboard**");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Next Class|Next Class|الفصل القادم/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Join Now|انضم الآن/i })).toBeVisible();
  });

  test("Student dashboard shows credit balance section", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/ar/dashboard**");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Credit Balance|رصيد الكريديت|الرصيد/i)).toBeVisible();
    await expect(page.getByText(/Classes Remaining|الحصص المتبقية/i)).toBeVisible();
    await expect(page.getByText(/Total Classes|إجمالي الحصص/i)).toBeVisible();
  });

  test("Student dashboard shows recent lesson reports section", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/ar/dashboard**");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Recent Lesson Reports|تقارير الدروس الأخيرة/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View All History|عرض كامل السجل/i })).toBeVisible();
  });

  test("Student can navigate to credits page via sidebar", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/ar/dashboard**");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /My Credits|كريديتاتي|رصيدي/i }).click();
    await page.waitForURL("**/ar/students/me/credits**");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /My Credits|كريديتاتي|رصيدي/i })).toBeVisible();
  });

  test("Student credits page shows transaction history", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.goto("/ar/students/me/credits");
    await page.waitForURL("**/ar/students/me/credits**");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Transaction History|سجل المعاملات/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Date|التاريخ/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Type|النوع/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Amount|المبلغ/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Notes|ملاحظات/i })).toBeVisible();
  });

  test("Mobile viewport: student dashboard renders mobile view (card list)", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/ar/dashboard**");
    await page.waitForLoadState("networkidle");

    const cardList = page
      .locator('[class*="MuiPaper-root"]')
      .filter({ hasText: /Next Class|Next Class|الفصل القادم/i });
    await expect(cardList.first()).toBeVisible();
  });

  test("Student sidebar shows all expected navigation items", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/ar/dashboard**");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: /Today's Classes|صفوف اليوم/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /My Schedule|جدولي/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /My Credits|كريديتاتي|رصيدي/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /My Profile|ملفي الشخصي/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Logout|تسجيل خروج/i })).toBeVisible();
  });
});
