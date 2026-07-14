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

describe("Supervisor Portal E2E", () => {
  test("Supervisor login -> dashboard loads with pending reviews hero card", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Dashboard page title
    await expect(page.getByRole("heading", { name: /لوحة المشرف/i })).toBeVisible();

    // Pending reviews hero card - shows count
    await expect(page.getByText(/لديك \d+ مراجعات معلقة بحاجة إلى اهتمامك/i)).toBeVisible();

    // Go to reviews button
    await expect(page.getByRole("button", { name: /انتقل إلى المراجعات/i })).toBeVisible();
  });

  test("Supervisor dashboard shows teacher dues summary", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Teacher dues summary section
    await expect(page.getByRole("heading", { name: /ملخص مستحقات المعلمين/i })).toBeVisible();
    await expect(page.getByText(/إجمالي المستحقات المعلقة/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /عرض مستحقات المعلمين/i })).toBeVisible();
  });

  test("Supervisor dashboard shows monthly reports shortcut", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Monthly reports shortcut section
    await expect(page.getByRole("heading", { name: /التقارير الشهرية/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /عرض التقارير الشهرية/i })).toBeVisible();
  });

  test("Supervisor can navigate to pending reviews page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Click go to reviews button
    await page.getByRole("button", { name: /انتقل إلى المراجعات/i }).click();
    await page.waitForURL("**/supervisor/lesson-reports**");
    await page.waitForLoadState("networkidle");

    // Pending reviews page title
    await expect(page.getByRole("heading", { name: /مراجعات الحصص المعلقة/i })).toBeVisible();

    // Filter dropdowns
    await expect(page.getByRole("combobox", { name: /تصفية حسب المعلم/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /تصفية حسب الطالب/i })).toBeVisible();
  });

  test("Pending reviews page shows queue with approve/reject buttons or empty state", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    await page.goto("/ar/supervisor/lesson-reports");
    await page.waitForLoadState("networkidle");

    // Check for either approve/reject buttons OR empty state message
    const approveButton = page.getByRole("button", { name: /قبول/i });
    const rejectButton = page.getByRole("button", { name: /رفض/i });
    const emptyState = page.getByText(/لا توجد مراجعات معلقة/i);

    // At least one of these should be visible
    const hasButtons =
      (await approveButton.isVisible().catch(() => false)) || (await rejectButton.isVisible().catch(() => false));
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasButtons || hasEmptyState).toBe(true);
  });

  test("Supervisor can navigate to teacher dues page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Click go to dues button
    await page.getByRole("button", { name: /عرض مستحقات المعلمين/i }).click();
    await page.waitForURL("**/supervisor/teacher-dues**");
    await page.waitForLoadState("networkidle");

    // Teacher dues page title
    await expect(page.getByRole("heading", { name: /مستحقات المعلمين/i })).toBeVisible();

    // Mark as paid button (batch action)
    await expect(page.getByRole("button", { name: /تحديد كمدفوع/i })).toBeVisible();

    // Table columns
    await expect(page.getByRole("columnheader", { name: /المعلم/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /تاريخ الحصة/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /الطالب/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /الحالة/i })).toBeVisible();
  });

  test("Supervisor can navigate to monthly reports page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Click go to monthly reports button
    await page.getByRole("button", { name: /عرض التقارير الشهرية/i }).click();
    await page.waitForURL("**/supervisor/monthly-reports**");
    await page.waitForLoadState("networkidle");

    // Monthly reports page title
    await expect(page.getByRole("heading", { name: /التقارير الشهرية/i })).toBeVisible();

    // Report type toggle
    await expect(page.getByRole("button", { name: /نوع التقرير/i })).toBeVisible();

    // Generate report button
    await expect(page.getByRole("button", { name: /إنشاء التقرير/i })).toBeVisible();

    // Year/Month selectors
    await expect(page.getByRole("combobox", { name: /السنة/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /الشهر/i })).toBeVisible();
  });

  test("Supervisor can navigate to profile page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    await page.goto("/ar/supervisor/profile");
    await page.waitForLoadState("networkidle");

    // Profile page loads (title may vary)
    await expect(page.getByRole("heading", { name: /الملف الشخصي|الملف/i })).toBeVisible();
  });

  test("Mobile viewport: supervisor dashboard renders mobile view", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Dashboard page title visible
    await expect(page.getByRole("heading", { name: /لوحة المشرف/i })).toBeVisible();

    // Pending reviews card visible (mobile uses card layout)
    await expect(page.getByText(/لديك \d+ مراجعات معلقة بحاجة إلى اهتمامك/i)).toBeVisible();

    // Teacher dues summary visible
    await expect(page.getByRole("heading", { name: /ملخص مستحقات المعلمين/i })).toBeVisible();

    // Monthly reports shortcut visible
    await expect(page.getByRole("button", { name: /عرض التقارير الشهرية/i })).toBeVisible();
  });
});
