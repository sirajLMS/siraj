import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { DEMO_USERS, gotoAppRoute, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, createMobileContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

// Bilingual regex patterns for quota UI labels.
// The demo user defaults to Arabic locale, so all patterns match Arabic.
const QUOTA_TITLE = /Student Quotas|حصص الطلاب/i;
const QUOTA_LIST_TITLE = /Quotas List|قائمة الحصص/i;
const NEW_QUOTA_BUTTON = /New Quota|حصة جديدة/i;
const CREATE_QUOTA_BUTTON = /Create Quota|إنشاء حصة/i;
const SAVE_BUTTON = /Save Changes|حفظ التغييرات/i;
const QUOTA_INSIGHTS_TITLE = /Quota System Overview|نظرة عامة على نظام الحصص/i;
const QUOTA_INSIGHTS_LINK = /Quota Insights|تحليلات الحصص/i;
const DELETE_QUOTA_BUTTON = /Delete Quota|حذف الحصة/i;
const STUDENT_LABEL = /Student|الطالب/i;
const KIND_LABEL = /Quota Type|نوع الحصة/i;
const VALID_FROM_LABEL = /Valid From|صالحة من/i;
const NO_QUOTAS = /No quotas found|لم يتم العثور على حصص/i;
const EMPTY_LIST_MSG = /No quotas found\. Create one|لم يتم العثور على حصص\. أنشئ/i;
const STATUS_LABEL = /^Status$|^الحالة$/i;
const DATE_RANGE_LABEL = /Date Range|النطاق الزمني/i;
const KIND_FILTER_LABEL = /^Kind$|^النوع$/i;
const STUDENT_FILTER_LABEL = /^Student$|^الطالب$/i;
const DELETE_CONFIRM = /^Delete$|^حذف$/i;
const DELETE_CANCEL = /^Cancel$|^إلغاء$/i;

let context: BrowserContext | undefined;
let page: Page | undefined;

afterEach(async () => {
  if (page) {
    await page.close();
  }
  if (context) {
    await context.close();
  }
  page = undefined;
  context = undefined;
});

/**
 * Common setup for desktop tests: create desktop context, new page, login, navigate.
 * Returns the page and context for direct use in the test.
 */
async function setupDesktopQuotaListTest(): Promise<{ page: Page; context: BrowserContext }> {
  context = await createContext();
  page = await context.newPage();
  await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
  await gotoQuotaList(page);
  return { page, context };
}

/**
 * Common setup for mobile tests: create mobile context, new page, login, navigate.
 */
async function setupMobileQuotaListTest(): Promise<{ page: Page; context: BrowserContext }> {
  context = await createMobileContext();
  page = await context.newPage();
  await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
  await gotoQuotaList(page);
  return { page, context };
}

/**
 * Common setup for desktop tests navigating to a specific route (not /quotas list).
 */
async function setupDesktopRouteTest(route: string): Promise<{ page: Page; context: BrowserContext }> {
  context = await createContext();
  page = await context.newPage();
  await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
  await gotoAppRoute(page, route);
  return { page, context };
}

/**
 * Common setup for mobile tests navigating to a specific route.
 */
async function setupMobileRouteTest(route: string): Promise<{ page: Page; context: BrowserContext }> {
  context = await createMobileContext();
  page = await context.newPage();
  await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
  await gotoAppRoute(page, route);
  return { page, context };
}

/**
 * Assert that a metric card (.MuiPaper-root) is attached to the DOM.
 */
async function expectMetricCard(p: Page): Promise<void> {
  const metricCard = p.locator(".MuiPaper-root").first();
  await metricCard.waitFor({ state: "attached" });
  expect(await metricCard.count()).toBeGreaterThan(0);
}

/**
 * Assert that the insights title is attached and a metric card is present.
 */
async function expectInsightsPageLoaded(p: Page): Promise<void> {
  const insightsTitle = p.getByText(QUOTA_INSIGHTS_TITLE).first();
  await insightsTitle.waitFor({ state: "attached", timeout: 30_000 });
  expect(await insightsTitle.count()).toBeGreaterThan(0);
  await expectMetricCard(p);
}

/**
 * Navigate to /quotas and wait for the page title to appear.
 * Uses waitFor with text assertion (not isVisible) to avoid flakiness
 * during Fade transitions and lazy-loaded component hydration.
 */
async function gotoQuotaList(p: Page): Promise<void> {
  await gotoAppRoute(p, "/quotas");
  await p.getByText(QUOTA_TITLE).first().waitFor({ state: "attached" });
}

/**
 * Wait for desktop content to appear — either DataGrid or empty state.
 * Confirms the lazy-loaded desktop component has hydrated.
 */
async function waitForDesktopContent(p: Page): Promise<void> {
  const dataGrid = p.locator(".MuiDataGrid-root").first();
  const emptyState = p.getByText(NO_QUOTAS).first();
  const errorState = p.getByText(EMPTY_LIST_MSG).first();

  const gridReady = dataGrid
    .waitFor({ state: "attached", timeout: 30_000 })
    .then(() => true)
    .catch(() => false);
  const emptyReady = emptyState
    .waitFor({ state: "attached", timeout: 30_000 })
    .then(() => true)
    .catch(() => false);
  const errorReady = errorState
    .waitFor({ state: "attached", timeout: 30_000 })
    .then(() => true)
    .catch(() => false);

  const [hasGrid, hasEmpty, hasError] = await Promise.all([gridReady, emptyReady, errorReady]);
  expect(hasGrid || hasEmpty || hasError).toBe(true);
}

describe.serial("Quota E2E", () => {
  test("Desktop: quota list renders with title and metric cards", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());

    expect(await page.getByText(QUOTA_TITLE).count()).toBeGreaterThan(0);
    await expectMetricCard(page);
  });

  test("Desktop: quota list data section visible (DataGrid or empty state)", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());
    await waitForDesktopContent(page);
  });

  test("Desktop: DataGrid pagination controls visible when DataGrid renders", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());

    const dataGrid = page.locator(".MuiDataGrid-root").first();
    const noData = page.getByText(NO_QUOTAS).first();
    const emptyError = page.getByText(EMPTY_LIST_MSG).first();

    const gridReady = dataGrid
      .waitFor({ state: "attached", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    const emptyReady = noData
      .waitFor({ state: "attached", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    const errorReady = emptyError
      .waitFor({ state: "attached", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    const [hasGrid, hasEmpty, hasError] = await Promise.all([gridReady, emptyReady, errorReady]);

    if (hasGrid) {
      const pagination = page.locator(".MuiDataGrid-pagination, .MuiPagination-root").first();
      await pagination.waitFor({ state: "attached" });
      expect(await pagination.count()).toBeGreaterThan(0);
    } else {
      expect(hasEmpty || hasError).toBe(true);
    }
  });

  test("Desktop: filter controls visible (search, status, kind)", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());
    await waitForDesktopContent(page);

    const searchInput = page.getByPlaceholder(QUOTA_LIST_TITLE).first();
    await searchInput.waitFor({ state: "attached" });
    expect(await searchInput.count()).toBeGreaterThan(0);

    const statusLabel = page.getByText(STATUS_LABEL).first();
    await statusLabel.waitFor({ state: "attached" });
    expect(await statusLabel.count()).toBeGreaterThan(0);

    const kindLabel = page.getByText(KIND_LABEL).first();
    await kindLabel.waitFor({ state: "attached" });
    expect(await kindLabel.count()).toBeGreaterThan(0);
  });

  test("Desktop: breadcrumbs render via MUI Breadcrumbs component", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());

    // DesktopPageHeader renders MUI <Breadcrumbs> without explicit aria-label;
    // use the MUI class selector instead of [aria-label="breadcrumb"].
    const breadcrumb = page.locator(".MuiBreadcrumbs-root").first();
    await breadcrumb.waitFor({ state: "attached" });
    expect(await breadcrumb.count()).toBeGreaterThan(0);
  });

  test("Desktop: New Quota link visible (renders as <a> via DesktopPrimaryPageAction)", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());

    const newQuotaLink = page.getByRole("link", { name: NEW_QUOTA_BUTTON }).first();
    await newQuotaLink.waitFor({ state: "attached" });
    expect(await newQuotaLink.count()).toBeGreaterThan(0);
  });

  test("Desktop: Insights link visible on quota list page", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());

    const insightsLink = page.getByRole("link", { name: QUOTA_INSIGHTS_LINK }).first();
    await insightsLink.waitFor({ state: "attached" });
    expect(await insightsLink.count()).toBeGreaterThan(0);
  });

  test("Mobile: page renders correctly in mobile viewport (title visible, no errors)", async () => {
    ({ page, context } = await setupMobileQuotaListTest());

    expect(await page.getByText(QUOTA_TITLE).count()).toBeGreaterThan(0);
    await expectMetricCard(page);
  });

  test("Mobile: quota create link visible (New Quota link in header or FAB)", async () => {
    ({ page, context } = await setupMobileQuotaListTest());

    // In production build, ResponsiveViewSwitch may not switch to mobile tier
    // due to useMediaQuery noSsr timing. Check for either link or FAB.
    const newQuotaLink = page.getByRole("link", { name: NEW_QUOTA_BUTTON }).first();
    const newQuotaFab = page.getByRole("button", { name: NEW_QUOTA_BUTTON }).first();

    const linkReady = newQuotaLink
      .waitFor({ state: "attached", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    const fabReady = newQuotaFab
      .waitFor({ state: "attached", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    const [hasLink, hasFab] = await Promise.all([linkReady, fabReady]);
    expect(hasLink || hasFab).toBe(true);
  });

  test("Create quota: navigate to form and verify form panels render", async () => {
    ({ page, context } = await setupDesktopRouteTest("/quotas/new"));

    // Wait for form page — the page heading renders the title text
    await page.getByText(NEW_QUOTA_BUTTON).first().waitFor({ state: "attached" });

    // Form has 3 DesktopSectionPanels: Student, Kind, Valid From
    // Each panel title appears as text content in the panel header
    const studentPanel = page.getByText(STUDENT_LABEL).first();
    await studentPanel.waitFor({ state: "attached", timeout: 30_000 });
    expect(await studentPanel.count()).toBeGreaterThan(0);

    const kindPanel = page.getByText(KIND_LABEL).first();
    await kindPanel.waitFor({ state: "attached" });
    expect(await kindPanel.count()).toBeGreaterThan(0);

    const validFromPanel = page.getByText(VALID_FROM_LABEL).first();
    await validFromPanel.waitFor({ state: "attached" });
    expect(await validFromPanel.count()).toBeGreaterThan(0);

    // Submit button — "Create Quota" or "Save Changes"
    const submitButton = page
      .getByRole("button", { name: CREATE_QUOTA_BUTTON })
      .or(page.getByRole("button", { name: SAVE_BUTTON }))
      .first();
    await submitButton.waitFor({ state: "attached" });
    expect(await submitButton.count()).toBeGreaterThan(0);
  });

  test.skip("Create quota: fill form, submit, success toast, redirect", async () => {
    // SKIP: Requires seed student data for StudentAutocomplete selection.
    // The StudentAutocomplete queries the GraphQL API for students; available
    // students depend on seed data which may not be consistent in the E2E env.
    ({ page, context } = await setupDesktopRouteTest("/quotas/new"));

    await page.getByText(NEW_QUOTA_BUTTON).first().waitFor({ state: "attached" });
    const nameField = page.getByLabel(/Quota Name|اسم الحصة/i).first();
    await nameField.waitFor({ state: "attached" });
    await nameField.fill("E2E Test Quota");

    const studentField = page.getByLabel(STUDENT_LABEL).first();
    await studentField.click();
    await page.getByRole("option").first().click();

    const totalClassesField = page.getByLabel(/Total Classes|إجمالي الحصص/i).first();
    await totalClassesField.fill("10");

    const submitButton = page.getByRole("button", { name: CREATE_QUOTA_BUTTON }).first();
    await submitButton.click();

    await page.waitForURL("**/quotas**", { timeout: 30_000 });
    expect(page.url()).toContain("/quotas");

    const listTitle = page.getByText(QUOTA_LIST_TITLE).first();
    await listTitle.waitFor({ state: "attached" });
    expect(await listTitle.count()).toBeGreaterThan(0);
  });

  test("Insights: page loads with title and metric cards", async () => {
    ({ page, context } = await setupDesktopRouteTest("/quotas/insights"));
    await expectInsightsPageLoaded(page);
  });

  test("Insights: filter controls visible (DesktopFilterButton elements)", async () => {
    ({ page, context } = await setupDesktopRouteTest("/quotas/insights"));

    const insightsTitle = page.getByText(QUOTA_INSIGHTS_TITLE).first();
    await insightsTitle.waitFor({ state: "attached", timeout: 30_000 });

    // Wait for metric cards to confirm loading state has resolved
    await expectMetricCard(page);

    // Filter buttons — DesktopFilterButton renders as <button> with bilingual text
    const anyFilter = page
      .getByRole("button", { name: /Date Range|Kind|Status|Student|النطاق الزمني|النوع|الحالة|الطالب/i })
      .first();
    await anyFilter.waitFor({ state: "attached", timeout: 30_000 });
    expect(await anyFilter.count()).toBeGreaterThan(0);

    const hasDateRange = (await page.getByRole("button", { name: DATE_RANGE_LABEL }).count()) > 0;
    const hasKind = (await page.getByRole("button", { name: KIND_FILTER_LABEL }).count()) > 0;
    const hasStatus = (await page.getByRole("button", { name: STATUS_LABEL }).count()) > 0;
    const hasStudent = (await page.getByRole("button", { name: STUDENT_FILTER_LABEL }).count()) > 0;
    expect(hasDateRange || hasKind || hasStatus || hasStudent).toBe(true);
  });

  test.skip("Delete quota: click delete, confirm dialog, success toast, redirect", async () => {
    // SKIP: Requires an existing quota in the database to delete.
    // Re-enable when a deterministic E2E quota fixture is created via GraphQL
    // mutation at test setup time.
    ({ page, context } = await setupDesktopQuotaListTest());

    const dataGrid = page.locator(".MuiDataGrid-root").first();
    await dataGrid.waitFor({ state: "attached" });

    const deleteButton = page.locator('button[aria-label*="Delete"], button[aria-label*="حذف"]').first();
    await deleteButton.waitFor({ state: "attached" });
    await deleteButton.click();

    const dialogTitle = page.getByText(DELETE_QUOTA_BUTTON).first();
    await dialogTitle.waitFor({ state: "attached" });
    expect(await dialogTitle.count()).toBeGreaterThan(0);

    const confirmButton = page.getByRole("button", { name: DELETE_CONFIRM }).first();
    await confirmButton.click();

    await page.waitForURL("**/quotas**", { timeout: 30_000 });
    expect(page.url()).toContain("/quotas");
  });

  test("Delete quota: dialog cancel dismisses without deleting (when data exists)", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());
    await waitForDesktopContent(page);

    const deleteButton = page.locator('button[aria-label*="Delete"], button[aria-label*="حذف"]').first();
    const hasDelete = (await deleteButton.count()) > 0;

    if (hasDelete) {
      await deleteButton.waitFor({ state: "attached" });
      await deleteButton.click();

      const dialogTitle = page.getByText(DELETE_QUOTA_BUTTON).first();
      await dialogTitle.waitFor({ state: "attached" });
      expect(await dialogTitle.count()).toBeGreaterThan(0);

      const cancelButton = page.getByRole("button", { name: DELETE_CANCEL }).first();
      await cancelButton.click();

      await dialogTitle.waitFor({ state: "detached" });
      expect(await dialogTitle.count()).toBe(0);
    } else {
      // No delete buttons visible (empty state) — verify no VISIBLE delete dialog.
      // Note: MUI NotificationDrawer renders role="dialog" in DOM but hidden.
      // Use :visible filter to check only actually visible dialogs.
      const visibleDialogs = await page.locator('[role="dialog"]:visible').count();
      expect(visibleDialogs).toBe(0);
    }
  });

  test("Bilingual: page renders labels in either English or Arabic", async () => {
    ({ page, context } = await setupDesktopQuotaListTest());

    expect(await page.getByText(QUOTA_TITLE).count()).toBeGreaterThan(0);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toBeNull();
    const pageContent = bodyText ?? "";
    const hasEnglish = /Quota/i.test(pageContent);
    const hasArabic = /حصص/i.test(pageContent);
    expect(hasEnglish || hasArabic).toBe(true);
  });

  test("Mobile insights: page loads with title and metric cards", async () => {
    ({ page, context } = await setupMobileRouteTest("/quotas/insights"));
    await expectInsightsPageLoaded(page);
  });
});
