import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Locator, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { closeE2eSession, DEMO_USERS, devWaitTimeout, gotoAppRoute, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const tr = (s: string): RegExp => new RegExp(escapeRegExp(s), "i");
const trExact = (s: string): RegExp => new RegExp(`^${escapeRegExp(s)}$`, "i");

const T = getDefaultTranslations().dashboardTranslations;
const dashboard = T.studentPortalDashboard;
const credits = T.studentPortalCredits;
const nav = T.coreNav;

const NEXT_CLASS = tr(dashboard.nextClass);
const NO_UPCOMING = tr(dashboard.noUpcomingClasses);
const JOIN_BUTTON = trExact(dashboard.joinNow);
const CLASSES_REMAINING = tr(dashboard.classesRemaining);
const CLASSES_TOTAL = tr(dashboard.classesTotal);
const RECENT_LESSON_REPORTS = tr(dashboard.recentLessonReports);
const CREDITS_LINK = tr(nav.studentCredits);
const TRANSACTION_HISTORY = tr(credits.transactionHistory);
const DATE_COLUMN = tr(credits.dateColumn);
const TYPE_COLUMN = tr(credits.typeColumn);
const AMOUNT_COLUMN = tr(credits.amountColumn);
const NOTES_COLUMN = tr(credits.notesColumn);
const TODAY_CLASSES_LINK = tr(nav.studentTodayClasses);
const LESSON_HISTORY_LINK = tr(nav.studentLessonHistory);
const SESSIONS_LINK = tr(nav.studentSessions);
const LOGOUT_BUTTON = tr(nav.logout);

let context: BrowserContext;
let page: Page;

afterEach(async () => {
  await closeE2eSession(page, context);
}, 30_000);

async function expectVisible(locator: Locator): Promise<void> {
  // waitFor({ state: "visible", timeout: devWaitTimeout }) is auto-waiting and proves the element
  // is visible. The previous pattern of waitFor + isVisible() races because
  // isVisible() is not auto-waiting and can return false during hydration
  // re-renders that happen between the two calls.
  await locator.first().waitFor({ state: "visible", timeout: devWaitTimeout });
}

describe("Student Portal E2E", () => {
  test("Student login → dashboard loads with NextClassJoinCard hero", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**", { timeout: devWaitTimeout });
    // Hero: Next Class label, or empty-state copy when no upcoming lesson
    const hero = page
      .locator('[class*="MuiPaper-root"], [class*="MuiBox-root"]')
      .filter({ hasText: new RegExp(`${NEXT_CLASS.source}|${NO_UPCOMING.source}`, "i") });
    await hero.first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await hero.first().isVisible()).toBe(true);

    // Join button when a joinable lesson is present
    const joinButton = page.getByRole("button", { name: JOIN_BUTTON });
    if (
      await joinButton
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await expectVisible(joinButton);
      expect(await joinButton.first().isVisible()).toBe(true);
    }
  });

  test("Student dashboard shows credit balance metrics", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**", { timeout: devWaitTimeout });
    const remaining = page.getByText(CLASSES_REMAINING);
    await expectVisible(remaining);
    expect(await remaining.first().isVisible()).toBe(true);
    const total = page.getByText(CLASSES_TOTAL);
    await expectVisible(total);
    expect(await total.first().isVisible()).toBe(true);
  });

  test("Student dashboard shows recent lesson reports section", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**", { timeout: devWaitTimeout });
    const reports = page.getByText(RECENT_LESSON_REPORTS);
    await expectVisible(reports);
    expect(await reports.first().isVisible()).toBe(true);
  });

  test("Student can navigate to credits page via sidebar", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**", { timeout: devWaitTimeout });
    // Wait for the credits link to be visible and clickable.
    // The sidebar is a lazy-loaded client component — in dev mode it may
    // take a while to compile. Using waitFor({ state: "visible", timeout: devWaitTimeout }) ensures
    // the link is rendered and hydrated before clicking.
    const creditsLink = page.getByRole("link", { name: CREDITS_LINK });
    await creditsLink.first().waitFor({ state: "visible", timeout: 60_000 });
    expect(await creditsLink.first().isVisible()).toBe(true);
    await creditsLink.click();
    await page.waitForURL("**/students/credits**", { timeout: devWaitTimeout });
    const creditsHeading = page.getByRole("heading", { name: CREDITS_LINK });
    await expectVisible(creditsHeading);
    expect(await creditsHeading.first().isVisible()).toBe(true);
  });

  test("Student credits page shows transaction history", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await gotoAppRoute(page, "/students/credits");
    await page.waitForURL("**/students/credits**", { timeout: devWaitTimeout });
    const historyHeading = page.getByRole("heading", { name: TRANSACTION_HISTORY });
    await expectVisible(historyHeading);
    expect(await historyHeading.first().isVisible()).toBe(true);
    const dateCol = page.getByRole("columnheader", { name: DATE_COLUMN });
    await expectVisible(dateCol);
    expect(await dateCol.first().isVisible()).toBe(true);
    const typeCol = page.getByRole("columnheader", { name: TYPE_COLUMN });
    await expectVisible(typeCol);
    expect(await typeCol.first().isVisible()).toBe(true);
    const amountCol = page.getByRole("columnheader", { name: AMOUNT_COLUMN });
    await expectVisible(amountCol);
    expect(await amountCol.first().isVisible()).toBe(true);
    const notesCol = page.getByRole("columnheader", { name: NOTES_COLUMN });
    await expectVisible(notesCol);
    expect(await notesCol.first().isVisible()).toBe(true);
  });

  test("Mobile viewport: student dashboard renders mobile view (card list)", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**", { timeout: devWaitTimeout });
    const hero = page
      .locator('[class*="MuiPaper-root"], [class*="MuiBox-root"]')
      .filter({ hasText: new RegExp(`${NEXT_CLASS.source}|${NO_UPCOMING.source}`, "i") });
    await expectVisible(hero.first());
    expect(await hero.first().isVisible()).toBe(true);
  });

  test("Student sidebar shows all expected navigation items", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**", { timeout: devWaitTimeout });
    const todayLink = page.getByRole("link", { name: TODAY_CLASSES_LINK });
    await expectVisible(todayLink);
    expect(await todayLink.first().isVisible()).toBe(true);
    const historyLink = page.getByRole("link", { name: LESSON_HISTORY_LINK });
    await expectVisible(historyLink);
    expect(await historyLink.first().isVisible()).toBe(true);
    const sessionsLink = page.getByRole("link", { name: SESSIONS_LINK });
    await expectVisible(sessionsLink);
    expect(await sessionsLink.first().isVisible()).toBe(true);
    const creditsLink = page.getByRole("link", { name: CREDITS_LINK });
    await expectVisible(creditsLink);
    expect(await creditsLink.first().isVisible()).toBe(true);
    const logoutBtn = page.getByRole("button", { name: LOGOUT_BUTTON });
    await expectVisible(logoutBtn);
    expect(await logoutBtn.first().isVisible()).toBe(true);
  });
});
