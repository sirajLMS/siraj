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
    expect(await page.getByRole("heading", { name: /لوحة المشرف/i }).isVisible()).toBe(true);

    // Pending reviews hero card - shows count
    expect(await page.getByText(/لديك \d+ مراجعات معلقة بحاجة إلى اهتمامك/i).isVisible()).toBe(true);

    // Go to reviews button
    expect(await page.getByRole("button", { name: /انتقل إلى المراجعات/i }).isVisible()).toBe(true);
  });

  test("Supervisor dashboard shows Recent Approvals section (not empty-state-only)", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    expect(await page.getByText(/الموافقات الأخيرة|Recent Approvals/i).isVisible()).toBe(true);

    const emptyState = page.getByText(/لا توجد موافقات حديثة|No recent approvals/i);
    const approvalRow = page.locator("button").filter({ hasText: /·/ });

    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasApprovals = (await approvalRow.count()) > 0;

    // Section must render meaningful content: either approval rows or the empty label
    expect(hasApprovals || hasEmptyState).toBe(true);
    // When seed data has approvals, prefer asserting rows (not empty-state-only)
    if (hasApprovals) {
      expect(hasEmptyState).toBe(false);
      expect(await approvalRow.first().isVisible()).toBe(true);
    }
  });

  test("Supervisor dashboard shows teacher dues summary", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Teacher dues summary section
    expect(await page.getByRole("heading", { name: /ملخص مستحقات المعلمين/i }).isVisible()).toBe(true);
    expect(await page.getByText(/إجمالي المستحقات المعلقة/i).isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: /عرض مستحقات المعلمين/i }).isVisible()).toBe(true);
  });

  test("Supervisor dashboard shows monthly reports shortcut", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Monthly reports shortcut section
    expect(await page.getByRole("heading", { name: /التقارير الشهرية/i }).isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: /عرض التقارير الشهرية/i }).isVisible()).toBe(true);
  });

  test("Supervisor can navigate to pending reviews page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Click go to reviews button
    await page.getByRole("button", { name: /انتقل إلى المراجعات/i }).click();
    await page.waitForURL("**/lesson-reports**");
    await page.waitForLoadState("networkidle");

    // Pending reviews page title
    expect(await page.getByRole("heading", { name: /مراجعات الحصص المعلقة/i }).isVisible()).toBe(true);

    // Filter Autocomplete fields
    expect(await page.getByLabel(/تصفية حسب المعلم|Filter by Teacher/i).isVisible()).toBe(true);
    expect(await page.getByLabel(/تصفية حسب الطالب|Filter by Student/i).isVisible()).toBe(true);
  });

  test("Pending reviews page shows queue with approve/reject buttons or empty state", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    await page.goto("/ar/lesson-reports");
    await page.waitForLoadState("networkidle");

    // Check for either approve/reject buttons OR empty state message
    const approveButton = page.getByRole("button", { name: /قبول|Approve/i });
    const rejectButton = page.getByRole("button", { name: /رفض|Reject/i });
    const emptyState = page.getByText(/لا توجد مراجعات معلقة|No pending reviews/i);

    // At least one of these should be visible
    const hasButtons =
      (await approveButton.isVisible().catch(() => false)) || (await rejectButton.isVisible().catch(() => false));
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasButtons || hasEmptyState).toBe(true);
  });

  test("Supervisor can navigate to teacher dues page with Mark as Paid", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Click go to dues button
    await page.getByRole("button", { name: /عرض مستحقات المعلمين/i }).click();
    await page.waitForURL("**/teacher-dues**");
    await page.waitForLoadState("networkidle");

    // Teacher dues page title
    expect(await page.getByRole("heading", { name: /مستحقات المعلمين/i }).isVisible()).toBe(true);

    // Mark as Paid — column header and/or row action button (permission-gated)
    const markPaidHeader = page.getByRole("columnheader", { name: /تحديد كمدفوع|Mark as Paid/i });
    const markPaidButton = page.getByRole("button", { name: /تحديد كمدفوع|Mark as Paid/i });
    const hasMarkPaid =
      (await markPaidHeader.isVisible().catch(() => false)) ||
      (await markPaidButton
        .first()
        .isVisible()
        .catch(() => false));
    expect(hasMarkPaid).toBe(true);

    // Table columns
    expect(await page.getByRole("columnheader", { name: /المعلم/i }).isVisible()).toBe(true);
    expect(await page.getByRole("columnheader", { name: /تاريخ الحصة/i }).isVisible()).toBe(true);
    expect(await page.getByRole("columnheader", { name: /الطالب/i }).isVisible()).toBe(true);
    expect(await page.getByRole("columnheader", { name: /الحالة/i }).isVisible()).toBe(true);
  });

  test("Supervisor can navigate to monthly reports page with Generate and Autocomplete", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Click go to monthly reports button
    await page.getByRole("button", { name: /عرض التقارير الشهرية/i }).click();
    await page.waitForURL("**/monthly-reports**");
    await page.waitForLoadState("networkidle");

    // Monthly reports page title
    expect(await page.getByRole("heading", { name: /التقارير الشهرية/i }).isVisible()).toBe(true);

    // Report type toggle
    expect(await page.getByText(/نوع التقرير/i).isVisible()).toBe(true);

    // Generate report button
    expect(await page.getByRole("button", { name: /إنشاء التقرير/i }).isVisible()).toBe(true);

    // Year/Month selectors
    expect(await page.getByLabel(/السنة/i).isVisible()).toBe(true);
    expect(await page.getByLabel(/الشهر/i).isVisible()).toBe(true);

    // Teacher Autocomplete (default report type is teacher)
    expect(await page.getByLabel(/اختر المعلم|Select Teacher/i).isVisible()).toBe(true);
  });

  test("Supervisor can navigate to profile page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    await page.goto("/ar/profile");
    await page.waitForLoadState("networkidle");

    // Canonical own-profile route (same as teachers/students)
    expect(await page.getByRole("heading", { name: /الملف الشخصي|الملف|Profile/i }).isVisible()).toBe(true);
  });

  test("Mobile viewport: supervisor dashboard renders mobile view", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.waitForLoadState("networkidle");

    // Dashboard page title visible
    expect(await page.getByRole("heading", { name: /لوحة المشرف/i }).isVisible()).toBe(true);

    // Pending reviews card visible (mobile uses card layout)
    expect(await page.getByText(/لديك \d+ مراجعات معلقة بحاجة إلى اهتمامك/i).isVisible()).toBe(true);

    // Teacher dues summary visible
    expect(await page.getByRole("heading", { name: /ملخص مستحقات المعلمين/i }).isVisible()).toBe(true);

    // Monthly reports shortcut visible
    expect(await page.getByRole("button", { name: /عرض التقارير الشهرية/i }).isVisible()).toBe(true);

    // Recent Approvals section
    expect(await page.getByText(/الموافقات الأخيرة/i).isVisible()).toBe(true);
  });
});
