import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import {
  authenticateDemoUser,
  closeE2eSession,
  DEMO_USERS,
  devWaitTimeout,
  gotoAppRoute,
  loginAsDemoUser,
  waitForDashboardReady,
} from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const tr = (s: string): RegExp => new RegExp(escapeRegExp(s), "i");
const trExact = (s: string): RegExp => new RegExp(`^${escapeRegExp(s)}$`, "i");

const T = getDefaultTranslations().dashboardTranslations;
const sched = T.coreSearchSchedule;
const nav = T.coreNav;

const SCHEDULE_SEARCH_NAV = tr(nav.scheduleSearch);
const SCHEDULE_SEARCH_TITLE = tr(sched.pageTitle);
const DATE_RANGE_LABEL = tr(sched.dateRange);
const TIME_RANGE_LABEL = tr(sched.timeRange);
const FILTERS_BUTTON = tr(sched.filters);
const SEARCH_BUTTON = trExact(sched.searchBtn);

const resultsCountPattern = escapeRegExp(sched.resultsCount(999, 999)).replace(/999/g, "\\d+");
const SEARCH_OUTCOME = new RegExp(`${resultsCountPattern}|${escapeRegExp(sched.noResults)}`, "i");

let adminContext: BrowserContext | undefined;
let adminPage: Page | undefined;
let isolatedContext: BrowserContext | undefined;
let isolatedPage: Page | undefined;

function scheduleSearchNavLink(page: Page) {
  return page.getByRole("link", { name: SCHEDULE_SEARCH_NAV }).first();
}

async function waitForScheduleSearchNav(page: Page): Promise<void> {
  const isDev = process.env.TEST_SERVER_MODE === "dev";
  await scheduleSearchNavLink(page).waitFor({ state: "visible", timeout: isDev ? 120_000 : 30_000 });
}

async function waitForSearchScheduleReady(page: Page): Promise<void> {
  if (page.url().includes("/login")) {
    throw new Error(`Login failed: redirected to ${page.url()}`);
  }

  const isDev = process.env.TEST_SERVER_MODE === "dev";

  if (!page.url().includes("/search-schedule")) {
    await page.waitForURL("**/search-schedule**", { waitUntil: "commit", timeout: isDev ? 120_000 : 30_000 });
  }

  await page
    .getByLabel(DATE_RANGE_LABEL)
    .first()
    .waitFor({ state: "visible", timeout: isDev ? 120_000 : 45_000 });
}

async function navigateToSearchSchedule(page: Page): Promise<void> {
  const isDev = process.env.TEST_SERVER_MODE === "dev";
  try {
    const link = scheduleSearchNavLink(page);
    await link.waitFor({ state: "visible", timeout: isDev ? 120_000 : 10_000 });
    await link.click({ timeout: 15_000 });
  } catch {
    await gotoAppRoute(page, "/search-schedule");
  }

  await waitForSearchScheduleReady(page);
}

describe.serial("Availability Search E2E", () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 5_000));

    adminContext = await createContext();
    adminPage = await adminContext.newPage();
    await loginAsDemoUser(adminPage, adminContext, DEMO_USERS.academyAdmin.groupSlug);
    await waitForScheduleSearchNav(adminPage);
  }, 400_000);

  afterAll(async () => {
    await closeE2eSession(adminPage, adminContext);
  }, 30_000);

  afterEach(async () => {
    await closeE2eSession(isolatedPage, isolatedContext);
    isolatedPage = undefined;
    isolatedContext = undefined;
  }, 30_000);

  test("Admin sees Schedule Search nav item in sidebar", async () => {
    if (!adminPage) throw new Error("adminPage not initialised in beforeAll");
    await waitForScheduleSearchNav(adminPage);
    expect(await scheduleSearchNavLink(adminPage).isVisible()).toBe(true);
  });

  test("Clicking nav item navigates to search-schedule page", async () => {
    if (!adminPage) throw new Error("adminPage not initialised in beforeAll");
    await navigateToSearchSchedule(adminPage);
    expect(adminPage.url()).toContain("/search-schedule");

    const heading = adminPage.getByText(SCHEDULE_SEARCH_TITLE).first();
    await heading.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await heading.isVisible()).toBe(true);
  });

  test("Search form renders with date/time range pickers, filter and search buttons", async () => {
    if (!adminPage) throw new Error("adminPage not initialised in beforeAll");
    if (!adminPage.url().includes("/search-schedule")) {
      await navigateToSearchSchedule(adminPage);
    }

    const dateRange = adminPage.getByLabel(DATE_RANGE_LABEL).first();
    const timeRange = adminPage.getByLabel(TIME_RANGE_LABEL).first();
    const filtersButton = adminPage.getByRole("button", { name: FILTERS_BUTTON }).first();
    const searchButton = adminPage.getByRole("button", { name: SEARCH_BUTTON }).first();

    await dateRange.waitFor({ state: "visible", timeout: devWaitTimeout });
    await timeRange.waitFor({ state: "visible", timeout: devWaitTimeout });
    await filtersButton.waitFor({ state: "visible", timeout: devWaitTimeout });
    await searchButton.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await dateRange.isVisible()).toBe(true);
    expect(await timeRange.isVisible()).toBe(true);
    expect(await filtersButton.isVisible()).toBe(true);
    expect(await searchButton.isVisible()).toBe(true);
  });

  test("Submitting form shows results or no-results message", async () => {
    if (!adminPage) throw new Error("adminPage not initialised in beforeAll");
    if (!adminPage.url().includes("/search-schedule")) {
      await navigateToSearchSchedule(adminPage);
    }

    const searchButton = adminPage.getByRole("button", { name: SEARCH_BUTTON }).first();
    await searchButton.click();

    const outcome = adminPage.getByText(SEARCH_OUTCOME).first();
    await outcome.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await outcome.isVisible()).toBe(true);
  });

  test("Teacher does NOT see Schedule Search nav item", async () => {
    isolatedContext = await createContext();
    isolatedPage = await isolatedContext.newPage();
    await authenticateDemoUser(isolatedContext, DEMO_USERS.teacher.groupSlug);
    await gotoAppRoute(isolatedPage, "/dashboard");
    await waitForDashboardReady(isolatedPage);

    expect(await isolatedPage.getByRole("link", { name: SCHEDULE_SEARCH_NAV }).count()).toBe(0);
  });
});
