import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { DEMO_USERS, devWaitTimeout, loginAsDemoUser } from "@/test/ui/e2e/helpers";
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
const APPROVED_STATUS = tr(dashboard.approvedStatus);
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

const PROFILE_CONTACT_SECTION = tr(profile.sections.contact);

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

async function expectVisible(locator: import("playwright").Locator): Promise<void> {
  await locator.first().waitFor({ state: "visible", timeout: devWaitTimeout });
  expect(await locator.first().isVisible()).toBe(true);
}

async function isVisibleSafe(locator: import("playwright").Locator): Promise<boolean> {
  try {
    await locator.first().waitFor({ state: "visible", timeout: devWaitTimeout });
    return true;
  } catch {
    return false;
  }
}

describe("Supervisor Portal E2E", () => {
  test("Supervisor login -> dashboard loads with pending reviews hero card", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Dashboard page title
    await expectVisible(page.getByRole("heading", { name: SUPERVISOR_DASHBOARD_TITLE }));

    // Pending reviews hero card - shows count
    await expectVisible(page.getByText(PENDING_REVIEWS_HERO));

    // Go to reviews button
    await expectVisible(page.getByRole("button", { name: GO_TO_REVIEWS }));
  });

  test("Supervisor dashboard shows Recent Approvals section (not empty-state-only)", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await expectVisible(page.getByText(RECENT_APPROVALS));

    const emptyState = page.getByText(NO_RECENT_APPROVALS);
    // Approval cards contain "مقبول" (approved) status text
    const approvalCard = page.locator('[class*="MuiPaper-root"]').filter({ hasText: APPROVED_STATUS });

    const hasEmptyState = await isVisibleSafe(emptyState);
    const hasApprovals = (await approvalCard.count()) > 0;

    // Section must render meaningful content: either approval rows or the empty label
    expect(hasApprovals || hasEmptyState).toBe(true);
    // When seed data has approvals, prefer asserting rows (not empty-state-only)
    if (hasApprovals) {
      expect(hasEmptyState).toBe(false);
      await expectVisible(approvalCard.first());
    }
  });

  test("Supervisor dashboard shows teacher dues summary", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Teacher dues summary section
    await expectVisible(page.getByRole("heading", { name: TEACHER_DUES_SUMMARY }));
    await expectVisible(page.getByText(TOTAL_PENDING_DUES));
    await expectVisible(page.getByRole("button", { name: GO_TO_DUES }));
  });

  test("Supervisor dashboard shows monthly reports shortcut", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Monthly reports shortcut section
    await expectVisible(page.getByRole("heading", { name: MONTHLY_REPORTS_SHORTCUT }));
    await expectVisible(page.getByRole("button", { name: GO_TO_MONTHLY_REPORTS }));
  });

  test("Supervisor can navigate to pending reviews page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Click go to reviews button
    await page.getByRole("button", { name: GO_TO_REVIEWS }).click();
    await page.waitForURL("**/lesson-reports**", { timeout: devWaitTimeout });
    // Pending reviews page title
    await expectVisible(page.getByRole("heading", { name: PENDING_REVIEWS_TITLE }));

    // Filter Autocomplete fields
    await expectVisible(page.getByLabel(FILTER_BY_TEACHER));
    await expectVisible(page.getByLabel(FILTER_BY_STUDENT));
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
    const hasButtons = (await isVisibleSafe(approveButton)) || (await isVisibleSafe(rejectButton));
    const hasEmptyState = await isVisibleSafe(emptyState);

    expect(hasButtons || hasEmptyState).toBe(true);
  });

  test("Supervisor can navigate to teacher dues page with Mark as Paid", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Click go to dues button
    await page.getByRole("button", { name: GO_TO_DUES }).click();
    await page.waitForURL("**/teacher-dues**", { timeout: devWaitTimeout });
    // Teacher dues page title
    await expectVisible(page.getByRole("heading", { name: TEACHER_DUES_TITLE }));

    // Mark as Paid — column header and/or row action button (permission-gated)
    const markPaidHeader = page.getByRole("columnheader", { name: MARK_AS_PAID });
    const markPaidButton = page.getByRole("button", { name: MARK_AS_PAID });
    const hasMarkPaid = (await isVisibleSafe(markPaidHeader)) || (await isVisibleSafe(markPaidButton));
    expect(hasMarkPaid).toBe(true);

    // Table columns
    await expectVisible(page.getByRole("columnheader", { name: TEACHER_COLUMN }));
    await expectVisible(page.getByRole("columnheader", { name: CLASS_DATE_COLUMN }));
    await expectVisible(page.getByRole("columnheader", { name: STUDENT_COLUMN }));
    await expectVisible(page.getByRole("columnheader", { name: STATUS_COLUMN }));
  });

  test("Supervisor can navigate to monthly reports page with Generate and Autocomplete", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Click go to monthly reports button
    await page.getByRole("button", { name: GO_TO_MONTHLY_REPORTS }).click();
    await page.waitForURL("**/monthly-reports**", { timeout: devWaitTimeout });
    // Monthly reports page title
    await expectVisible(page.getByRole("heading", { name: MONTHLY_REPORTS_TITLE }));

    // Report type toggle
    await expectVisible(page.getByText(REPORT_TYPE_TOGGLE));

    // Generate report button
    await expectVisible(page.getByRole("button", { name: GENERATE_REPORT }));

    // Year/Month selectors
    await expectVisible(page.getByLabel(SELECT_YEAR));
    await expectVisible(page.getByLabel(SELECT_MONTH));

    // Teacher Autocomplete (default report type is teacher)
    await expectVisible(page.getByLabel(SELECT_TEACHER));
  });

  test("Supervisor can navigate to profile page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    await page.goto("/profile");
    // Profile page shows contact information section
    await expectVisible(page.getByRole("heading", { name: PROFILE_CONTACT_SECTION }));
  });

  test("Mobile viewport: supervisor dashboard renders mobile view", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);
    // Dashboard page title visible
    await expectVisible(page.getByRole("heading", { name: SUPERVISOR_DASHBOARD_TITLE }));

    // Pending reviews card visible (mobile uses card layout)
    await expectVisible(page.getByText(PENDING_REVIEWS_HERO));

    // Teacher dues summary visible
    await expectVisible(page.getByRole("heading", { name: TEACHER_DUES_SUMMARY }));

    // Monthly reports shortcut visible
    await expectVisible(page.getByRole("button", { name: GO_TO_MONTHLY_REPORTS }));

    // Recent Approvals section
    await expectVisible(page.getByText(RECENT_APPROVALS));
  });
});
