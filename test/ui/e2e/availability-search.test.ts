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

function setupPageTimeouts(p: Page): void {
  p.setDefaultNavigationTimeout(90000);
  p.setDefaultTimeout(60000);
}

describe("Availability Search E2E", () => {
  test("Admin sees Schedule Search nav item in sidebar", async () => {
    context = await createContext();
    page = await context.newPage();
    setupPageTimeouts(page);
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const navItem = page.getByText("بحث الجدول");
    expect(await navItem.isVisible()).toBe(true);
  });

  test("Clicking nav item navigates to search-schedule page", async () => {
    context = await createContext();
    page = await context.newPage();
    setupPageTimeouts(page);
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const navItem = page.getByText("بحث الجدول");
    await navItem.click();

    await page.waitForURL("**/search-schedule**");
    expect(await page.url()).toContain("/search-schedule");

    const heading = page.getByText("البحث عن توفر الجدول");
    expect(await heading.isVisible()).toBe(true);
  });

  test("Search form renders with date/time range pickers, filter and search buttons", async () => {
    context = await createContext();
    page = await context.newPage();
    setupPageTimeouts(page);
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page.goto("/ar/search-schedule");
    await page.waitForURL("**/search-schedule**");

    const dateRange = page.getByLabel("نطاق التاريخ");
    const timeRange = page.getByLabel("نطاق الوقت");
    const filtersButton = page.getByRole("button", { name: "الفلاتر" });
    const searchButton = page.getByRole("button", { name: "بحث" });

    expect(await dateRange.isVisible()).toBe(true);
    expect(await timeRange.isVisible()).toBe(true);
    expect(await filtersButton.isVisible()).toBe(true);
    expect(await searchButton.isVisible()).toBe(true);
  });

  test("Submitting form shows results or no-results message", async () => {
    context = await createContext();
    page = await context.newPage();
    setupPageTimeouts(page);
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page.goto("/ar/search-schedule");
    await page.waitForURL("**/search-schedule**");

    const searchButton = page.getByRole("button", { name: "بحث" });
    await searchButton.click();

    const hasResults = page.getByText(/معلمين مع \d+ فترات متاحة/);
    const noResults = page.getByText("لم يتم العثور على فقرات زمنية متاحة للمعايير المحددة.");

    const maxAttempts = 20;
    let found = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const resultsVisible = await hasResults.isVisible().catch(() => false);
      const noResultsVisible = await noResults.isVisible().catch(() => false);
      if (resultsVisible || noResultsVisible) {
        found = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    expect(found).toBe(true);
  });

  test("Teacher does NOT see Schedule Search nav item", async () => {
    context = await createContext();
    page = await context.newPage();
    setupPageTimeouts(page);
    await loginAsDemoUser(page, context, DEMO_USERS.teacher.groupSlug);

    const navItem = page.getByText("بحث الجدول");
    expect(await navItem.isVisible()).toBe(false);
  });

  test("Mobile: form renders on search-schedule page", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    setupPageTimeouts(page);
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page.goto("/ar/search-schedule");
    await page.waitForURL("**/search-schedule**");

    const heading = page.getByText("البحث عن توفر الجدول");
    const searchButton = page.getByRole("button", { name: "بحث" });

    expect(await heading.isVisible()).toBe(true);
    expect(await searchButton.isVisible()).toBe(true);
  });
});
