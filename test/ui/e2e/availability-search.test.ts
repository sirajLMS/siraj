import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { DEMO_USERS, loginAsDemoUser } from "./helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "./lifecycle";

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

describe("Availability Search E2E", () => {
  test("Academy Admin sees Schedule Search nav item in sidebar", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const navItem = page.getByText("Schedule Search");
    expect(navItem).toBeVisible();
  });

  test("Clicking nav item navigates to search-schedule page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    const navItem = page.getByText("Schedule Search");
    await navItem.click();

    await page.waitForURL("**/search-schedule**");
    expect(page.url()).toContain("/search-schedule");

    expect(page.getByText("Schedule Availability Search")).toBeVisible();
  });

  test("Search form renders with From/To time inputs and Gender dropdown", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page.goto("/ar/search-schedule");
    await page.waitForURL("**/search-schedule**");

    expect(page.getByLabel("From")).toBeVisible();
    expect(page.getByLabel("To")).toBeVisible();
    expect(page.getByLabel("Gender")).toBeVisible();
    expect(page.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("Submitting form shows results or no-results message", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page.goto("/ar/search-schedule");
    await page.waitForURL("**/search-schedule**");

    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const hasResults = page.getByText(/teachers with.*available slots/);
    const noResults = page.getByText("No available time slots found for the selected criteria.");

    expect(hasResults.or(noResults)).toBeVisible();
  });

  test("Teacher does NOT see Schedule Search nav item", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.teacher.groupSlug);

    const navItem = page.getByText("Schedule Search");
    await expect(navItem).not.toBeVisible();
  });

  test("Mobile: form renders on search-schedule page", async () => {
    context = await createMobileContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);

    await page.goto("/ar/search-schedule");
    await page.waitForURL("**/search-schedule**");

    expect(page.getByText("Schedule Availability Search")).toBeVisible();
    expect(page.getByRole("button", { name: /search/i })).toBeVisible();
  });
});
