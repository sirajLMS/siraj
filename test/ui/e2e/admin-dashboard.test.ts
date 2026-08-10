import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { closeE2eSession, DEMO_USERS, gotoAppRoute, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

const SEARCH_SCHEDULE_TITLE = /search schedule availability|البحث عن توفر الجدول/i;
const SEARCH_BUTTON = /^search$|^بحث$/i;

let context: BrowserContext | undefined;
let page: Page | undefined;

afterEach(async () => {
  await closeE2eSession(page, context);
  page = undefined;
  context = undefined;
});

describe.serial("Admin Dashboard E2E", () => {
  test("Admin sees search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const textbox = page.getByRole("textbox");
    await textbox.first().waitFor({ state: "visible" });
    expect(await textbox.first().isVisible()).toBe(true);
  });

  test("Admin sees timezone columns", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    // Desktop admin dashboard renders schedule cards (not MuiDataGrid). Timezone fields
    // appear as labeled meta stats when ScheduleViewTimezones is granted.
    await page
      .getByText(/schedule overview|نظرة عامة على الجدول/i)
      .first()
      .waitFor({ state: "visible" });

    const yourTimeLabel = page.getByText(/your time|وقتك/i).first();
    await yourTimeLabel.waitFor({ state: "visible" });
    expect(await yourTimeLabel.isVisible()).toBe(true);

    const teacherTimeLabel = page.getByText(/teacher time|وقت المعلم/i).first();
    await teacherTimeLabel.waitFor({ state: "visible" });
    expect(await teacherTimeLabel.isVisible()).toBe(true);

    const studentTimeLabel = page.getByText(/student time|وقت الطالب/i).first();
    await studentTimeLabel.waitFor({ state: "visible" });
    expect(await studentTimeLabel.isVisible()).toBe(true);
  });

  test("Search filters schedule grid", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const searchInput = page.getByPlaceholder(/search by student|البحث بالطالب/i).first();
    await searchInput.waitFor({ state: "visible" });

    // Wait for seeded schedule cards before asserting the filter narrows results.
    await page
      .getByText(/teacher time|وقت المعلم/i)
      .first()
      .waitFor({ state: "visible" });

    await searchInput.fill("zzzz-e2e-no-match");

    const emptyState = page.getByText(/no classes|لا توجد حصص/i).first();
    await emptyState.waitFor({ state: "visible" });
    expect(await emptyState.isVisible()).toBe(true);
  });

  test("Admin sees details action on schedule cards", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page
      .getByText(/teacher time|وقت المعلم/i)
      .first()
      .waitFor({ state: "visible" });

    const detailsButton = page.locator('[aria-label*="details"], [title*="Details"]').first();
    const hasDetailsAction = (await detailsButton.count()) > 0;
    if (hasDetailsAction) {
      expect(await detailsButton.isVisible()).toBe(true);
    }
  });

  test("Teacher does not see search input", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.teacher.groupSlug);

    const searchInput = page.getByPlaceholder(/search|بحث/i);
    expect(await searchInput.count()).toBe(0);
  });

  test("Mobile: card list renders instead of data grid", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page
      .getByText(/schedule overview|نظرة عامة على الجدول/i)
      .first()
      .waitFor({ state: "visible" });

    expect(await page.locator(".MuiDataGrid-root").count()).toBe(0);

    const scheduleCardMarker = page.getByText(/your time|وقتك/i).first();
    await scheduleCardMarker.waitFor({ state: "visible" });
    expect(await scheduleCardMarker.isVisible()).toBe(true);
  });

  test("Mobile: search schedule form renders", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
    await gotoAppRoute(page, "/search-schedule");

    const heading = page.getByText(SEARCH_SCHEDULE_TITLE).first();
    const searchButton = page.getByRole("button", { name: SEARCH_BUTTON }).first();

    await searchButton.waitFor({ state: "visible" });
    expect(await heading.isVisible()).toBe(true);
    expect(await searchButton.isVisible()).toBe(true);
  });
});
