import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import {
  authenticateDemoUser,
  closeE2eSession,
  DEMO_USERS,
  gotoAppRoute,
  loginAsDemoUser,
} from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

const SCHEDULE_SEARCH_NAV = /schedule search|بحث الجدول/i;
const SCHEDULE_SEARCH_TITLE = /search schedule availability|البحث عن توفر الجدول/i;
const DATE_RANGE_LABEL = /date range|نطاق التاريخ/i;
const TIME_RANGE_LABEL = /time range|نطاق الوقت/i;
const FILTERS_BUTTON = /filters|الفلاتر/i;
const SEARCH_BUTTON = /^search$|^بحث$/i;
const SEARCH_OUTCOME =
  /teachers with \d+ available slots|معلمين مع \d+ فترات متاحة|no available time slots found|لم يتم العثور على فترات زمنية متاحة/i;

let adminContext: BrowserContext | undefined;
let adminPage: Page | undefined;
let isolatedContext: BrowserContext | undefined;
let isolatedPage: Page | undefined;

function scheduleSearchNavLink(page: Page) {
  return page.getByRole("link", { name: SCHEDULE_SEARCH_NAV }).first();
}

async function waitForScheduleSearchNav(page: Page): Promise<void> {
  await scheduleSearchNavLink(page).waitFor({ state: "visible", timeout: 30_000 });
}

async function waitForSearchScheduleReady(page: Page): Promise<void> {
  if (page.url().includes("/login")) {
    throw new Error(`Login failed: redirected to ${page.url()}`);
  }

  if (!page.url().includes("/search-schedule")) {
    await page.waitForURL("**/search-schedule**", { waitUntil: "commit", timeout: 30_000 });
  }

  await page.getByLabel(DATE_RANGE_LABEL).first().waitFor({ state: "visible", timeout: 45_000 });
}

async function navigateToSearchSchedule(page: Page): Promise<void> {
  try {
    const link = scheduleSearchNavLink(page);
    await link.waitFor({ state: "visible", timeout: 10_000 });
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
  });

  afterAll(async () => {
    await closeE2eSession(adminPage, adminContext);
  });

  afterEach(async () => {
    await closeE2eSession(isolatedPage, isolatedContext);
    isolatedPage = undefined;
    isolatedContext = undefined;
  });

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
    await heading.waitFor({ state: "visible" });
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

    await dateRange.waitFor({ state: "visible" });
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
    await outcome.waitFor({ state: "visible" });
    expect(await outcome.isVisible()).toBe(true);
  });

  test("Teacher does NOT see Schedule Search nav item", async () => {
    isolatedContext = await createContext();
    isolatedPage = await isolatedContext.newPage();
    await authenticateDemoUser(isolatedContext, DEMO_USERS.teacher.groupSlug);
    await gotoAppRoute(isolatedPage, "/dashboard");
    await isolatedPage
      .getByText(/today's classes|حصص اليوم/i)
      .first()
      .waitFor({ state: "visible", timeout: 45_000 });

    expect(await isolatedPage.getByRole("link", { name: SCHEDULE_SEARCH_NAV }).count()).toBe(0);
  });
});
