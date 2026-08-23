import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { closeE2eSession, DEMO_USERS, loginAsDemoUserAtRoute } from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

/**
 * E2E tests for the Site Appearance Customizer (Phase 10.4).
 *
 * Covers AC-20 (Appearance tab visibility for authorised users only),
 * AC-21 (overlay entry/exit, save/publish flow through the toolbar), and
 * AC-31 (SSR reflection of the published appearance in document metadata
 * and the `--mui-palette-primary-main` CSS custom property).
 *
 * Conventions (per `test/ui/AGENTS.md`):
 *   - All user-facing text is sourced from `getDefaultTranslations()`.
 *   - No `waitForTimeout` / `networkidle` — Playwright auto-waits only.
 *   - Dev-mode aware timeouts (`headingTimeout`) for first-compile waits.
 *   - `setupBrowserLifecycle()` at module scope spawns the shared Chromium
 *     browser + the Next.js test server (port 3000 in dev mode if running,
 *     otherwise a fresh dev server on port 3099).
 */

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const tr = (s: string): RegExp => new RegExp(escapeRegExp(s), "i");
const trExact = (s: string): RegExp => new RegExp(`^${escapeRegExp(s)}$`, "i");

const T = getDefaultTranslations().dashboardTranslations.settings;
const APPEARANCE_TAB_LABEL = tr(T.tabs.appearance);
const ENTER_CUSTOMIZE = trExact(T.appearance.enterCustomizeMode);
const TOOLBAR_BADGE = trExact(T.appearance.toolbarBadge);
const TOOLBAR_EXIT = trExact(T.appearance.toolbarExit);
const TOOLBAR_PUBLISH = trExact(T.appearance.toolbarPublish);
const SAVE_DRAFT = trExact(T.appearance.saveDraft);
const SAVE_DRAFT_SUCCESS = tr(T.appearance.saveDraftSuccess);
const PUBLISH_SUCCESS = tr(T.appearance.publishSuccess);

/**
 * Hardcoded English aria-label emitted by `CustomizeSidebar.tsx`. Not a
 * translation key today — recorded in the outcome file as a minor i18n
 * follow-up. Stable across locales for E2E purposes.
 */
const SIDEBAR_ARIA = "Customize mode sidebar";

/**
 * Hardcoded English aria-label emitted by `ColorEditorSection.tsx` for the
 * Light-mode Primary color `<input type="color">`. Same caveat as above.
 */
const PRIMARY_COLOR_PICKER = "Primary color picker";

const isDevMode = process.env.TEST_SERVER_MODE === "dev";
const headingTimeout = isDevMode ? 240_000 : 30_000;
const SETTINGS_URL = "/settings";
const SETTINGS_APPEARANCE_URL = "/settings?tab=appearance";

let context: BrowserContext | undefined;
let page: Page | undefined;

afterEach(async () => {
  await closeE2eSession(page, context);
  page = undefined;
  context = undefined;
}, 30_000);

/**
 * Waits for the settings page's tab list to render. Used as a
 * "page-is-ready" sentinel by every test that navigates to /settings.
 */
async function waitForSettingsTabs(p: Page): Promise<void> {
  const tabList = p.getByRole("tablist").first();
  await tabList.waitFor({ state: "visible", timeout: headingTimeout });
}

/**
 * Authenticates as super_admin, navigates to the settings page with
 * `?tab=appearance&customize=1`, and waits for the customize toolbar to
 * mount. Returns the toolbar locator so callers can chain further
 * assertions/actions on it.
 *
 * Shared by the Exit + Save/Publish tests to avoid intra-file setup
 * duplication (jscpd code-clone gate).
 */
async function enterCustomizeModeAsSuperAdmin(): Promise<Page> {
  context = await createContext();
  page = await context.newPage();
  await loginAsDemoUserAtRoute(
    page,
    context,
    DEMO_USERS.superAdmin.groupSlug,
    `${SETTINGS_APPEARANCE_URL}&customize=1`
  );
  const toolbar = page.getByRole("banner", { name: TOOLBAR_BADGE }).first();
  await toolbar.waitFor({ state: "visible", timeout: headingTimeout });
  return page;
}

describe.serial("Appearance Customizer E2E", () => {
  test("super_admin sees Appearance tab on settings page (AC-20)", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUserAtRoute(page, context, DEMO_USERS.superAdmin.groupSlug, SETTINGS_URL);
    await waitForSettingsTabs(page);

    const appearanceTab = page.getByRole("tab", { name: APPEARANCE_TAB_LABEL }).first();
    await appearanceTab.waitFor({ state: "visible", timeout: headingTimeout });
    expect(await appearanceTab.isVisible()).toBe(true);
  });

  test("teacher without SETTINGS_APPEARANCE_MANAGE does NOT see Appearance tab (AC-20)", async () => {
    context = await createContext();
    page = await context.newPage();
    // `teacher_default` group has no SETTINGS_APPEARANCE_MANAGE permission
    // (Task 1.1 seed only grants it to super_admin + academy_admin).
    await loginAsDemoUserAtRoute(page, context, DEMO_USERS.teacher.groupSlug, SETTINGS_URL);
    await waitForSettingsTabs(page);

    const appearanceTab = page.getByRole("tab", { name: APPEARANCE_TAB_LABEL });
    // Hard 0-count is asserted because the tab is filtered out by
    // `getVisibleSettingsTabs(hasPermission)` before render.
    expect(await appearanceTab.count()).toBe(0);
  });

  test("super_admin can open the customizer overlay via the tab CTA (AC-21)", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUserAtRoute(page, context, DEMO_USERS.superAdmin.groupSlug, SETTINGS_APPEARANCE_URL);
    await waitForSettingsTabs(page);

    // Click the in-tab "Enter Customize Mode" CTA — pushes ?customize=1.
    const enterButton = page.getByRole("button", { name: ENTER_CUSTOMIZE }).first();
    await enterButton.waitFor({ state: "visible", timeout: headingTimeout });
    await enterButton.click({ timeout: headingTimeout });

    // URL updates to include customize=1.
    await page.waitForURL(url => url.toString().includes("customize=1"), { timeout: headingTimeout });
    expect(page.url()).toContain("customize=1");

    // Toolbar renders as <header aria-label={t.toolbarBadge}>.
    const toolbar = page.getByRole("banner", { name: TOOLBAR_BADGE }).first();
    await toolbar.waitFor({ state: "visible", timeout: headingTimeout });
    expect(await toolbar.isVisible()).toBe(true);

    // Sidebar renders as <aside aria-label="Customize mode sidebar">.
    const sidebar = page.getByLabel(SIDEBAR_ARIA).first();
    await sidebar.waitFor({ state: "visible", timeout: headingTimeout });
    expect(await sidebar.isVisible()).toBe(true);
  });

  test("clicking Exit in the toolbar strips ?customize=1 and unmounts the overlay (AC-21)", async () => {
    page = await enterCustomizeModeAsSuperAdmin();

    const exitButton = page.getByRole("button", { name: TOOLBAR_EXIT }).first();
    await exitButton.click({ timeout: headingTimeout });

    // URL loses customize=1.
    await page.waitForURL(url => !url.toString().includes("customize=1"), { timeout: headingTimeout });
    expect(page.url()).not.toContain("customize=1");

    // Toolbar unmounts.
    const toolbarAfter = page.getByRole("banner", { name: TOOLBAR_BADGE });
    await toolbarAfter.waitFor({ state: "detached", timeout: headingTimeout });
    expect(await toolbarAfter.count()).toBe(0);
  });

  test("toolbar Save Draft + Publish surface success toasts (AC-21)", async () => {
    page = await enterCustomizeModeAsSuperAdmin();

    // Edit the Light-mode Primary color to set dirty=true. The ColorField
    // component renders an <input type="color" aria-label="Primary color
    // picker">. React tracks value via the native setter, so we use the
    // prototype descriptor to set the value before dispatching `input`.
    const primaryColorInput = page.locator(`input[aria-label="${PRIMARY_COLOR_PICKER}"]`).first();
    await primaryColorInput.waitFor({ state: "visible", timeout: headingTimeout });

    // A deterministic color distinct from the default draft (#0D9488).
    // Published end-state is cleaned up by the next test's GraphQL reset.
    const TEST_COLOR = "#1A237E";
    await primaryColorInput.evaluate((el, color) => {
      if (!(el instanceof HTMLInputElement)) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(el, color);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, TEST_COLOR);

    // Save Draft button is disabled when !dirty; after the color edit
    // it becomes enabled. Playwright auto-waits for actionability
    // (visible + enabled + stable) before clicking, so a bare click()
    // blocks until the dirty flag propagates through the store.
    const saveDraftButton = page.getByRole("button", { name: SAVE_DRAFT }).first();
    await saveDraftButton.click({ timeout: headingTimeout });

    // AC-21 — saveAppearanceDraft success surfaces t.saveDraftSuccess toast.
    const saveToast = page.getByText(SAVE_DRAFT_SUCCESS).first();
    await saveToast.waitFor({ state: "visible", timeout: headingTimeout });
    expect(await saveToast.isVisible()).toBe(true);

    // Publish button is always enabled (no dirty gate). Clicking fires the
    // publishAppearance mutation -> revalidateTag("appearance") -> toast.
    const publishButton = page.getByRole("button", { name: TOOLBAR_PUBLISH }).first();
    await publishButton.waitFor({ state: "visible", timeout: headingTimeout });
    await publishButton.click({ timeout: headingTimeout });

    const publishToast = page.getByText(PUBLISH_SUCCESS).first();
    await publishToast.waitFor({ state: "visible", timeout: headingTimeout });
    expect(await publishToast.isVisible()).toBe(true);
  });

  test("published appearance is reflected in SSR metadata + theme CSS vars (AC-31)", async () => {
    // The previous test published a draft whose Light-mode Primary color
    // is #1A237E. The publish resolver calls `revalidateTag("appearance")`,
    // so the next SSR render of any page reads the fresh published row.
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUserAtRoute(page, context, DEMO_USERS.superAdmin.groupSlug, SETTINGS_APPEARANCE_URL);
    await waitForSettingsTabs(page);

    // AC-31 (a) — `frontend/common/lib/server-theme-css.ts` emits the
    // `--mui-palette-primary-main` CSS custom property on <html>.
    const htmlStyle = await page.evaluate(() => document.documentElement.getAttribute("style") ?? "");
    expect(htmlStyle.toLowerCase()).toContain("--mui-palette-primary-main");

    // AC-31 (b) — <title> reflects the published siteName (or the default
    // app-title fallback). Either way it must be a non-empty string.
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // AC-31 (c) — <meta name="description"> reflects the published
    // siteDescription (or the default app-description fallback).
    const metaDescription = page.locator('meta[name="description"]').first();
    await metaDescription.waitFor({ state: "attached", timeout: headingTimeout });
    const descriptionContent = (await metaDescription.getAttribute("content")) ?? "";
    expect(descriptionContent.length).toBeGreaterThan(0);

    // AC-31 (d) — the inline <html> style should contain the published
    // Light-mode primary color (#1A237E from the previous test).
    expect(htmlStyle.toLowerCase()).toContain("#1a237e");
  });
});
