import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Locator, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { DEMO_USERS, loginAsDemoUser } from "@/test/ui/e2e/helpers";
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
  if (page) {
    await page.close();
  }
  if (context) {
    await context.close();
  }
});

async function expectVisible(locator: Locator): Promise<void> {
  await locator.first().waitFor({ state: "visible" });
  expect(await locator.first().isVisible()).toBe(true);
}

describe("Student Portal E2E", () => {
  test("Student login → dashboard loads with NextClassJoinCard hero", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    // Hero: Next Class label, or empty-state copy when no upcoming lesson
    const hero = page
      .locator('[class*="MuiPaper-root"], [class*="MuiBox-root"]')
      .filter({ hasText: new RegExp(`${NEXT_CLASS.source}|${NO_UPCOMING.source}`, "i") });
    await hero.first().waitFor({ state: "visible" });
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
    }
  });

  test("Student dashboard shows credit balance metrics", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await expectVisible(page.getByText(CLASSES_REMAINING));
    await expectVisible(page.getByText(CLASSES_TOTAL));
  });

  test("Student dashboard shows recent lesson reports section", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await expectVisible(page.getByText(RECENT_LESSON_REPORTS));
  });

  test("Student can navigate to credits page via sidebar", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await page.getByRole("link", { name: CREDITS_LINK }).click();
    await page.waitForURL("**/students/credits**");
    await expectVisible(page.getByRole("heading", { name: CREDITS_LINK }));
  });

  test("Student credits page shows transaction history", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.goto("/students/credits");
    await page.waitForURL("**/students/credits**");
    await expectVisible(page.getByRole("heading", { name: TRANSACTION_HISTORY }));
    await expectVisible(page.getByRole("columnheader", { name: DATE_COLUMN }));
    await expectVisible(page.getByRole("columnheader", { name: TYPE_COLUMN }));
    await expectVisible(page.getByRole("columnheader", { name: AMOUNT_COLUMN }));
    await expectVisible(page.getByRole("columnheader", { name: NOTES_COLUMN }));
  });

  test("Mobile viewport: student dashboard renders mobile view (card list)", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    const hero = page
      .locator('[class*="MuiPaper-root"], [class*="MuiBox-root"]')
      .filter({ hasText: new RegExp(`${NEXT_CLASS.source}|${NO_UPCOMING.source}`, "i") });
    await expectVisible(hero.first());
  });

  test("Student sidebar shows all expected navigation items", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.student.groupSlug);

    await page.waitForURL("**/dashboard**");
    await expectVisible(page.getByRole("link", { name: TODAY_CLASSES_LINK }));
    await expectVisible(page.getByRole("link", { name: LESSON_HISTORY_LINK }));
    await expectVisible(page.getByRole("link", { name: SESSIONS_LINK }));
    await expectVisible(page.getByRole("link", { name: CREDITS_LINK }));
    await expectVisible(page.getByRole("button", { name: LOGOUT_BUTTON }));
  });
});
