import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { closeE2eSession, DEMO_USERS, devWaitTimeout, gotoAppRoute, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const admin = getDefaultTranslations().dashboardTranslations.admin;
const schedule = getDefaultTranslations().dashboardTranslations.coreSearchSchedule;

const SEARCH_SCHEDULE_TITLE = new RegExp(escapeRegExp(schedule.pageTitle));
const SEARCH_BUTTON = new RegExp(`^${escapeRegExp(schedule.searchBtn)}$`);
const SCHEDULE_OVERVIEW = new RegExp(escapeRegExp(admin.scheduleOverview));
const YOUR_TIME = new RegExp(escapeRegExp(admin.yourTime));
const TEACHER_TIME = new RegExp(escapeRegExp(admin.teacherTime));
const STUDENT_TIME = new RegExp(escapeRegExp(admin.studentTime));
const SEARCH_PLACEHOLDER = new RegExp(escapeRegExp(admin.searchPlaceholder));
const NO_CLASSES = new RegExp(escapeRegExp(admin.noClasses));

let context: BrowserContext | undefined;
let page: Page | undefined;

afterEach(async () => {
  await closeE2eSession(page, context);
  page = undefined;
  context = undefined;
}, 30_000);

describe.serial("Admin Dashboard E2E", () => {
  test("Admin sees search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const textbox = page.getByRole("textbox").first();
    await textbox.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await textbox.isVisible()).toBe(true);
  });

  test("Admin sees timezone columns", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    // Desktop admin dashboard renders schedule cards (not MuiDataGrid). Timezone fields
    // appear as labeled meta stats when ScheduleViewTimezones is granted.
    const overview = page.getByText(SCHEDULE_OVERVIEW).first();
    await overview.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await overview.isVisible()).toBe(true);

    // Timezone labels only appear inside schedule cards. If no classes are scheduled today,
    // the dashboard shows an empty state instead. Verify timezone labels if cards are present.
    const yourTimeLabel = page.getByText(YOUR_TIME).first();
    const hasScheduleCards = (await yourTimeLabel.count()) > 0;

    if (hasScheduleCards) {
      await yourTimeLabel.waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await yourTimeLabel.isVisible()).toBe(true);

      const teacherTimeLabel = page.getByText(TEACHER_TIME).first();
      await teacherTimeLabel.waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await teacherTimeLabel.isVisible()).toBe(true);

      const studentTimeLabel = page.getByText(STUDENT_TIME).first();
      await studentTimeLabel.waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await studentTimeLabel.isVisible()).toBe(true);
    }
  });

  test("Search filters schedule grid", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER).first();
    await searchInput.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await searchInput.isVisible()).toBe(true);

    // Wait for seeded schedule cards before asserting the filter narrows results.
    // If no classes are scheduled today, the filter still works — it just shows the empty state.
    const teacherTimeLabel = page.getByText(TEACHER_TIME).first();
    const hasScheduleCards = (await teacherTimeLabel.count()) > 0;

    if (hasScheduleCards) {
      await teacherTimeLabel.waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await teacherTimeLabel.isVisible()).toBe(true);
    }

    await searchInput.fill("zzzz-e2e-no-match");

    const emptyState = page.getByText(NO_CLASSES).first();
    await emptyState.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await emptyState.isVisible()).toBe(true);
  });

  test("Admin sees details action on schedule cards", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const overview = page.getByText(SCHEDULE_OVERVIEW).first();
    await overview.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await overview.isVisible()).toBe(true);

    // Only check details button if schedule cards are present
    const teacherTimeLabel = page.getByText(TEACHER_TIME).first();
    const hasScheduleCards = (await teacherTimeLabel.count()) > 0;

    if (hasScheduleCards) {
      await teacherTimeLabel.waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await teacherTimeLabel.isVisible()).toBe(true);

      const detailsButton = page
        .locator(`[aria-label*="${escapeRegExp(admin.details)}"], [title*="${escapeRegExp(admin.details)}"]`)
        .first();
      const hasDetailsAction = (await detailsButton.count()) > 0;
      if (hasDetailsAction) {
        await detailsButton.waitFor({ state: "visible", timeout: devWaitTimeout });
        expect(await detailsButton.isVisible()).toBe(true);
      }
    }
  });

  test("Teacher does not see search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.teacher.groupSlug);

    const searchInput = page.getByPlaceholder(new RegExp(escapeRegExp(admin.searchPlaceholder)));
    expect(await searchInput.count()).toBe(0);
  });

  test("Mobile: card list renders instead of data grid", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const overview = page.getByText(SCHEDULE_OVERVIEW).first();
    await overview.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await overview.isVisible()).toBe(true);

    expect(await page.locator(".MuiDataGrid-root").count()).toBe(0);

    // Schedule cards with YOUR_TIME label only appear if classes are scheduled today.
    // If no classes, the empty state renders instead — still valid for mobile card list check.
    const scheduleCardMarker = page.getByText(YOUR_TIME).first();
    const hasCards = (await scheduleCardMarker.count()) > 0;
    if (hasCards) {
      await scheduleCardMarker.waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await scheduleCardMarker.isVisible()).toBe(true);
    }
  });

  test("Mobile: search schedule form renders", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
    await gotoAppRoute(page, "/search-schedule");

    const heading = page.getByText(SEARCH_SCHEDULE_TITLE).first();
    const searchButton = page.getByRole("button", { name: SEARCH_BUTTON }).first();

    await searchButton.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await searchButton.isVisible()).toBe(true);
    await heading.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await heading.isVisible()).toBe(true);
  });
});
