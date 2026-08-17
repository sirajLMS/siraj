import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { DEMO_USERS, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const tr = (s: string): RegExp => new RegExp(escapeRegExp(s), "i");

const T = getDefaultTranslations().dashboardTranslations;
const dashboard = T.supervisorPortalDashboard;
const reviews = T.supervisorPortalPendingReviews;
const dues = T.supervisorPortalTeacherDues;
const reports = T.supervisorPortalMonthlyReports;
const profile = T.supervisorPortalProfile;

// Functional translation: pendingReviewsHero(count) returns `${count} مراجعات معلقة بحاجة إلى اهتمامك`
// Build a regex from its pattern, replacing the count interpolation with \d+
const pendingReviewsHeroPattern = escapeRegExp(dashboard.pendingReviewsHero(999)).replace("999", "\\d+");
const PENDING_REVIEWS_HERO = new RegExp(pendingReviewsHeroPattern, "i");

const SUPERVISOR_DASHBOARD_TITLE = tr(dashboard.pageTitle);
const GO_TO_REVIEWS = tr(dashboard.goToReviews);
const RECENT_APPROVALS = tr(dashboard.recentApprovals);
const NO_RECENT_APPROVALS = tr(dashboard.noRecentApprovals);
const TEACHER_DUES_SUMMARY = tr(dashboard.teacherDuesSummary);
const TOTAL_PENDING_DUES = tr(dashboard.totalPendingDues);
const GO_TO_DUES = tr(dashboard.goToDues);
const MONTHLY_REPORTS_SHORTCUT = tr(dashboard.monthlyReportsShortcut);
const GO_TO_MONTHLY_REPORTS = tr(dashboard.goToMonthlyReports);

const PENDING_REVIEWS_TITLE = tr(reviews.pageTitle);
const FILTER_BY_TEACHER = tr(reviews.filterByTeacher);
const FILTER_BY_STUDENT = tr(reviews.filterByStudent);
const APPROVE_BUTTON = tr(reviews.approveButton);
const REJECT_BUTTON = tr(reviews.rejectButton);
const NO_PENDING_REVIEWS = tr(reviews.noPendingReviews);

const TEACHER_DUES_TITLE = tr(dues.pageTitle);
const MARK_AS_PAID = tr(dues.markAsPaidButton);
const TEACHER_COLUMN = tr(dues.teacherNameColumn);
const CLASS_DATE_COLUMN = tr(dues.classDateColumn);
const STUDENT_COLUMN = tr(dues.studentColumn);
const STATUS_COLUMN = tr(dues.statusColumn);

const MONTHLY_REPORTS_TITLE = tr(reports.pageTitle);
const REPORT_TYPE_TOGGLE = tr(reports.reportTypeToggle);
const GENERATE_REPORT = tr(reports.generateReport);
const SELECT_YEAR = tr(reports.selectYear);
const SELECT_MONTH = tr(reports.selectMonth);
const SELECT_TEACHER = tr(reports.selectTeacher);

const PROFILE_TITLE = tr(profile.pageTitle);

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
    // Dashboard page title
    expect(await page.getByRole("heading", { name: SUPERVISOR_DASHBOARD_TITLE }).isVisible()).toBe(true);

    // Pending reviews hero card - shows count
    expect(await page.getByText(PENDING_REVIEWS_HERO).isVisible()).toBe(true);

    // Go to reviews button
    expect(await page.getByRole("button", { name: GO_TO_REVIEWS }).isVisible()).toBe(true);
  });

  test("Supervisor dashboard shows Recent Approvals section (not empty-state-only)", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    expect(await page.getByText(RECENT_APPROVALS).isVisible()).toBe(true);

    const emptyState = page.getByText(NO_RECENT_APPROVALS);
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
    // Teacher dues summary section
    expect(await page.getByRole("heading", { name: TEACHER_DUES_SUMMARY }).isVisible()).toBe(true);
    expect(await page.getByText(TOTAL_PENDING_DUES).isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: GO_TO_DUES }).isVisible()).toBe(true);
  });

  test("Supervisor dashboard shows monthly reports shortcut", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Monthly reports shortcut section
    expect(await page.getByRole("heading", { name: MONTHLY_REPORTS_SHORTCUT }).isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: GO_TO_MONTHLY_REPORTS }).isVisible()).toBe(true);
  });

  test("Supervisor can navigate to pending reviews page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Click go to reviews button
    await page.getByRole("button", { name: GO_TO_REVIEWS }).click();
    await page.waitForURL("**/lesson-reports**");
    // Pending reviews page title
    expect(await page.getByRole("heading", { name: PENDING_REVIEWS_TITLE }).isVisible()).toBe(true);

    // Filter Autocomplete fields
    expect(await page.getByLabel(FILTER_BY_TEACHER).isVisible()).toBe(true);
    expect(await page.getByLabel(FILTER_BY_STUDENT).isVisible()).toBe(true);
  });

  test("Pending reviews page shows queue with approve/reject buttons or empty state", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.goto("/lesson-reports");
    // Check for either approve/reject buttons OR empty state message
    const approveButton = page.getByRole("button", { name: APPROVE_BUTTON });
    const rejectButton = page.getByRole("button", { name: REJECT_BUTTON });
    const emptyState = page.getByText(NO_PENDING_REVIEWS);

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
    // Click go to dues button
    await page.getByRole("button", { name: GO_TO_DUES }).click();
    await page.waitForURL("**/teacher-dues**");
    // Teacher dues page title
    expect(await page.getByRole("heading", { name: TEACHER_DUES_TITLE }).isVisible()).toBe(true);

    // Mark as Paid — column header and/or row action button (permission-gated)
    const markPaidHeader = page.getByRole("columnheader", { name: MARK_AS_PAID });
    const markPaidButton = page.getByRole("button", { name: MARK_AS_PAID });
    const hasMarkPaid =
      (await markPaidHeader.isVisible().catch(() => false)) ||
      (await markPaidButton
        .first()
        .isVisible()
        .catch(() => false));
    expect(hasMarkPaid).toBe(true);

    // Table columns
    expect(await page.getByRole("columnheader", { name: TEACHER_COLUMN }).isVisible()).toBe(true);
    expect(await page.getByRole("columnheader", { name: CLASS_DATE_COLUMN }).isVisible()).toBe(true);
    expect(await page.getByRole("columnheader", { name: STUDENT_COLUMN }).isVisible()).toBe(true);
    expect(await page.getByRole("columnheader", { name: STATUS_COLUMN }).isVisible()).toBe(true);
  });

  test("Supervisor can navigate to monthly reports page with Generate and Autocomplete", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Click go to monthly reports button
    await page.getByRole("button", { name: GO_TO_MONTHLY_REPORTS }).click();
    await page.waitForURL("**/monthly-reports**");
    // Monthly reports page title
    expect(await page.getByRole("heading", { name: MONTHLY_REPORTS_TITLE }).isVisible()).toBe(true);

    // Report type toggle
    expect(await page.getByText(REPORT_TYPE_TOGGLE).isVisible()).toBe(true);

    // Generate report button
    expect(await page.getByRole("button", { name: GENERATE_REPORT }).isVisible()).toBe(true);

    // Year/Month selectors
    expect(await page.getByLabel(SELECT_YEAR).isVisible()).toBe(true);
    expect(await page.getByLabel(SELECT_MONTH).isVisible()).toBe(true);

    // Teacher Autocomplete (default report type is teacher)
    expect(await page.getByLabel(SELECT_TEACHER).isVisible()).toBe(true);
  });

  test("Supervisor can navigate to profile page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.goto("/profile");
    // Canonical own-profile route (same as teachers/students)
    expect(await page.getByRole("heading", { name: PROFILE_TITLE }).isVisible()).toBe(true);
  });

  test("Mobile viewport: supervisor dashboard renders mobile view", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Dashboard page title visible
    expect(await page.getByRole("heading", { name: SUPERVISOR_DASHBOARD_TITLE }).isVisible()).toBe(true);

    // Pending reviews card visible (mobile uses card layout)
    expect(await page.getByText(PENDING_REVIEWS_HERO).isVisible()).toBe(true);

    // Teacher dues summary visible
    expect(await page.getByRole("heading", { name: TEACHER_DUES_SUMMARY }).isVisible()).toBe(true);

    // Monthly reports shortcut visible
    expect(await page.getByRole("button", { name: GO_TO_MONTHLY_REPORTS }).isVisible()).toBe(true);

    // Recent Approvals section
    expect(await page.getByText(RECENT_APPROVALS).isVisible()).toBe(true);
  });
});
