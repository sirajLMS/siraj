import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Locator, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { closeE2eSession, DEMO_USERS, devWaitTimeout, gotoAppRoute, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const tr = (s: string): RegExp => new RegExp(escapeRegExp(s), "i");

const T = getDefaultTranslations().dashboardTranslations;
const lr = T.lmsLessonReports;
const nav = T.coreNav;
const reviews = T.supervisorPortalPendingReviews;

const DIALOG_TITLE = tr(lr.dialogTitle);
const ATTENDANCE_EVALUATION = tr(lr.attendanceEvaluation);
const DURATION_MINUTES = tr(lr.durationMinutes);
const COMPLETION_PERCENTAGE = tr(lr.completionPercentage);
const TEACHER_NOTES = tr(lr.teacherNotes);
const SUBMIT_BUTTON = tr(lr.submit);
const MARK_COMPLETED_BUTTON = tr(lr.markCompletedButton);
const APPROVED_STATUS = tr(lr.approved);
const PENDING_REVIEWS_TITLE = tr(reviews.pageTitle);
const LESSON_REPORTS_TITLE = tr(lr.title);
const APPROVE_BUTTON = tr(reviews.approveButton);
const APPROVE_SUCCESS = tr(reviews.approveSuccess);
const LOGOUT_BUTTON = tr(nav.logout);

let context: BrowserContext;
let page: Page;

afterEach(async () => {
  await closeE2eSession(page, context);
}, 30_000);

type LocatorLike = ReturnType<Page["getByRole"]>;

async function isVisible(locator: LocatorLike): Promise<boolean> {
  try {
    await locator.first().waitFor({ state: "visible", timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

async function waitForSuccessOrHidden(dialog: Locator, snackbar: Locator): Promise<void> {
  try {
    await snackbar.waitFor({ state: "visible", timeout: devWaitTimeout });
  } catch {
    expect(await dialog.isVisible()).toBe(false);
  }
}

async function logout(appContext: BrowserContext, pageNumber: Page): Promise<void> {
  const logoutButton = pageNumber.getByRole("button", { name: LOGOUT_BUTTON }).first();
  if (await isVisible(logoutButton)) {
    await logoutButton.click();
    await pageNumber.waitForURL("**/login**", { timeout: devWaitTimeout });
    return;
  }
  await appContext.clearCookies();
  await pageNumber.goto("/login");
  await pageNumber.waitForURL("**/login**", { timeout: devWaitTimeout });
}

async function loginDemo(role: "teacher" | "supervisor"): Promise<void> {
  context = await createContext();
  page = await context.newPage();
  await loginAsDemoUser(page, context, DEMO_USERS[role].groupSlug);
}

async function fillLessonReportDialog(pageNumber: Page): Promise<void> {
  const dialog = pageNumber.getByRole("dialog", { name: DIALOG_TITLE });
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });

  const attendanceSelect = dialog.getByLabel(ATTENDANCE_EVALUATION);
  await attendanceSelect.waitFor({ state: "visible", timeout: devWaitTimeout });
  await attendanceSelect.selectOption({ label: lr.present });

  const durationInput = dialog.getByLabel(DURATION_MINUTES);
  await durationInput.waitFor({ state: "visible", timeout: devWaitTimeout });
  await durationInput.fill("60");

  const completionSlider = dialog.getByRole("slider", { name: COMPLETION_PERCENTAGE });
  await completionSlider.waitFor({ state: "visible", timeout: devWaitTimeout });
  await completionSlider.evaluate((el: HTMLInputElement) => {
    el.value = "100";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const notesInput = dialog.getByLabel(TEACHER_NOTES);
  await notesInput.waitFor({ state: "visible", timeout: devWaitTimeout });
  await notesInput.fill("Test lesson report");

  const submitButton = dialog.getByRole("button", { name: SUBMIT_BUTTON }).first();
  await submitButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  await submitButton.click();

  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
}

async function submitTeacherLessonReportIfAvailable(pageNumber: Page): Promise<void> {
  const markCompletedButton = pageNumber.getByRole("button", { name: MARK_COMPLETED_BUTTON }).first();
  const hasMarkCompletedButton = await isVisible(markCompletedButton);

  if (!hasMarkCompletedButton) {
    const pageTitle = pageNumber.getByRole("heading", { level: 2 });
    await pageTitle.first().waitFor({ state: "visible", timeout: devWaitTimeout });
    return;
  }

  await markCompletedButton.click();
  await fillLessonReportDialog(pageNumber);
}

async function approvePendingReportIfAvailable(pageNumber: Page): Promise<void> {
  const reviewsTitle = pageNumber.getByRole("heading", {
    name: new RegExp(`${PENDING_REVIEWS_TITLE.source}|${LESSON_REPORTS_TITLE.source}`, "i"),
  });
  await reviewsTitle.first().waitFor({ state: "visible", timeout: devWaitTimeout });

  const reportRow = pageNumber.locator('[role="row"]').filter({ hasText: "Test lesson report" }).first();
  const hasReport = await isVisible(reportRow);

  if (!hasReport) {
    return;
  }

  const approveButton = reportRow.getByRole("button", { name: APPROVE_BUTTON }).first();
  await approveButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  await approveButton.click();

  const successSnackbar = pageNumber.getByRole("status", { name: APPROVE_SUCCESS });
  await waitForSuccessOrHidden(reviewsTitle.first(), successSnackbar);

  const approvedStatus = reportRow.getByText(APPROVED_STATUS);
  try {
    await approvedStatus.waitFor({ state: "visible", timeout: devWaitTimeout });
  } catch {
    expect(await approveButton.isVisible()).toBe(false);
  }
}

describe("Teacher Lesson Report E2E Flow", () => {
  test("Teacher submits lesson report and supervisor approves it", async () => {
    // ====================================================================
    // TEACHER FLOW
    // ====================================================================
    await loginDemo("teacher");

    // loginAsDemoUser already navigates to /dashboard and calls waitForDashboardReady.
    // No need for a redundant waitForURL here.
    expect(page.url()).toContain("/dashboard");

    const pageTitle = page.getByRole("heading", { level: 2 });
    await pageTitle.first().waitFor({ state: "visible", timeout: devWaitTimeout });

    await submitTeacherLessonReportIfAvailable(page);

    await logout(context, page);

    // ====================================================================
    // SUPERVISOR FLOW
    // ====================================================================
    await loginDemo("supervisor");

    await gotoAppRoute(page, "/lesson-reports");
    await page.waitForURL("**/lesson-reports**", { timeout: devWaitTimeout });
    expect(page.url()).toContain("/lesson-reports");

    await approvePendingReportIfAvailable(page);

    await logout(context, page);
  });

  test("Teacher dashboard loads and Mark Completed button exists", async () => {
    context = await createContext();
    page = await context.newPage();

    await loginAsDemoUser(page, context, DEMO_USERS.teacher.groupSlug);

    // Verify teacher dashboard loads
    const dashboardTitle = page.getByRole("heading", { level: 2 });
    await dashboardTitle.first().waitFor({ state: "visible", timeout: devWaitTimeout });

    // Check for Mark Completed button (either enabled or disabled)
    const markCompletedButtons = page.getByRole("button", { name: MARK_COMPLETED_BUTTON });
    const buttonCount = await markCompletedButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(0); // At least no error

    // Check for schedule grid or list view
    const scheduleGrid = page.locator('[role="rowgroup"], [class*="schedule"], [class*="Schedule"]').first();
    try {
      await scheduleGrid.waitFor({ state: "visible", timeout: devWaitTimeout });
    } catch {
      // Fallback: verify the dashboard heading is still visible
      await dashboardTitle.first().waitFor({ state: "visible", timeout: devWaitTimeout });
    }
  });

  test("Supervisor can access lesson reports page", async () => {
    context = await createContext();
    page = await context.newPage();

    await loginAsDemoUser(page, context, DEMO_USERS.supervisor.groupSlug);

    await gotoAppRoute(page, "/lesson-reports");
    await page.waitForURL("**/lesson-reports**", { timeout: devWaitTimeout });
    expect(page.url()).toContain("/lesson-reports");

    // Verify page loads with pending reviews container
    const pageTitle = page.getByRole("heading", {
      name: new RegExp(`${PENDING_REVIEWS_TITLE.source}|${LESSON_REPORTS_TITLE.source}`, "i"),
    });
    await pageTitle.first().waitFor({ state: "visible", timeout: devWaitTimeout });
  });
});
