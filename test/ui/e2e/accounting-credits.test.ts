import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import type { BrowserContext, Locator, Page } from "playwright";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getDefaultTranslations } from "@/shared/locale/server";
import { getTestBaseUrl } from "@/test/helpers";
import {
  closeE2eSession,
  DEMO_USERS,
  devWaitTimeout,
  gotoAppRoute,
  loginAsDemoUserAtRoute,
} from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const exactText = (s: string): RegExp => new RegExp(`^${escapeRegExp(s)}$`, "i");

const T = getDefaultTranslations().dashboardTranslations;
const credits = T.billingCreditAdjustment;
const directory = T.studentDirectory;
const nav = T.coreNav;

const CREDITS_PATH = "/accounting/credits";
const ADJUST_PATH = "/accounting/credits/adjust";

const CREDITS_TITLE = new RegExp(escapeRegExp(credits.title));
const ADJUST_BUTTON = exactText(credits.adjustCredits);
const CREDITS_NAV_LINK = new RegExp(escapeRegExp(nav.accountingCredits));
const HOURS_LABEL = new RegExp(escapeRegExp(credits.hours.label));
// Field labels render with a required-field asterisk inside the label, so the
// accessible name is "<label> *" — anchored equality never matches; substring
// regexes on the translated text are used for all form-field selectors.
const REASON_LABEL = new RegExp(escapeRegExp(credits.reason.label));
const SUBTRACT_CARD = new RegExp(escapeRegExp(credits.adjustmentType.subtract));
const CARRYOVER_CARD = new RegExp(escapeRegExp(credits.adjustmentType.subtractWithCarryover));
const CARRYOVER_BANNER_TITLE = new RegExp(escapeRegExp(credits.carryover.bannerTitle));
const TEACHER_LABEL = new RegExp(escapeRegExp(credits.carryover.teacher));
const FROM_DATE_LABEL = new RegExp(escapeRegExp(credits.carryover.fromDate));
const TO_DATE_LABEL = new RegExp(escapeRegExp(credits.carryover.toDate));
const PAYMENT_DATE_LABEL = new RegExp(escapeRegExp(credits.carryover.paymentDate));

/**
 * Test input data (operator-typed reason), not a rendered translation.
 * A per-run suffix keeps the ledger audit trail distinguishable between runs;
 * server-side idempotency keys exclude notes, so rerun uniqueness comes from
 * the per-run hour amounts chosen in the flow test below.
 */
const E2E_REASON = `E2E credit adjustment reason ${Date.now().toString(36)}`;

let context: BrowserContext | undefined;
let page: Page | undefined;

afterEach(async () => {
  await closeE2eSession(page, context);
  page = undefined;
  context = undefined;
}, 30_000);

interface Balance {
  readonly remaining: number;
  readonly total: number;
}

function parseBalance(text: string | null): Balance {
  // The chip label is exactly "<remaining> / <total>"; split instead of regex
  // to keep the expression free of backtracking ambiguity.
  const parts = (text ?? "").split("/").map(part => part.trim());
  const remaining = Number(parts[0]);
  const total = Number(parts[1]);
  if (Number.isNaN(remaining) || Number.isNaN(total)) {
    throw new Error(`Unable to parse balance chip text: "${text ?? ""}"`);
  }
  return { remaining, total };
}

function balanceText(balance: Balance): string {
  return `${balance.remaining} / ${balance.total}`;
}

interface StudentTarget {
  readonly name: string;
  readonly balance: Balance;
}

/**
 * Picks a directory row whose student name appears exactly once. Concurrent
 * test suites leak identically-named fixture students into the directory; an
 * ambiguous name makes row-scoped assertions attach to the wrong twin.
 *
 * Selection rotates across the unique candidates on purpose: the server-side
 * idempotency key is (actor, studentId, type, hours, carryover teacher/dates)
 * — see the flow test — and hours rotate only over 30 per-minute values.
 * Always taking the FIRST unique row replays an earlier same-day run's key on
 * rollover, returning the old ledger row with no balance change and hanging
 * the post-submit balance verification. The minute-derived index spreads runs
 * across candidates without needing randomness (sonarjs/pseudo-random).
 */
async function pickUniqueStudent(p: Page): Promise<StudentTarget> {
  const rows = p.locator(".MuiDataGrid-row");
  await rows.first().waitFor({ state: "visible", timeout: devWaitTimeout });
  const names = await rows.evaluateAll(elements =>
    elements.map(element => element.querySelector("p")?.textContent?.trim() ?? "")
  );
  const seen = new Map<string, number>();
  for (const name of names) seen.set(name, (seen.get(name) ?? 0) + 1);
  const candidates = names.filter(name => name.length > 0 && seen.get(name) === 1);
  const rotatingIndex = Math.floor(Date.now() / 60_000) % Math.max(candidates.length, 1);
  const studentName = candidates.length > 0 ? (candidates[rotatingIndex] ?? "") : (names[0] ?? "");
  expect(studentName.length).toBeGreaterThan(0);
  const row = rows.filter({ hasText: studentName }).first();
  const balance = parseBalance(await row.locator(".MuiChip-label").first().textContent());
  return { name: studentName, balance };
}

async function expectToast(p: Page, pattern: RegExp): Promise<void> {
  const toast = p.getByText(pattern).first();
  await toast.waitFor({ state: "visible", timeout: devWaitTimeout });
}

async function searchForStudent(p: Page, studentName: string): Promise<void> {
  const search = p.locator(`input[aria-label="${escapeRegExp(directory.searchPlaceholder)}"]`);
  await search.waitFor({ state: "visible", timeout: devWaitTimeout });
  await search.fill(studentName);
}

/**
 * Balance assertion after a submit. Prefers the student-credits list (AC-2.6
 * surface) when the name search resolves to exactly one row; parallel suites
 * leak identically-named fixture students into the directory, so when the
 * search is ambiguous it falls back to the pinned deep-link: the adjust
 * form's preselection summary renders the same `remaining / total` chip for
 * the exact student id.
 */
async function verifyBalanceAfterSubmit(
  p: Page,
  studentName: string,
  studentId: string,
  expected: Balance
): Promise<void> {
  await searchForStudent(p, studentName);
  const rows = p.locator(".MuiDataGrid-row").filter({ hasText: studentName });
  const chip = rows
    .first()
    .locator(".MuiChip-label")
    .filter({ hasText: balanceText(expected) });
  const listResolved = await chip
    .waitFor({ state: "visible", timeout: 60_000 })
    .then(async () => (await rows.count()) === 1)
    .catch(() => false);
  if (listResolved) return;

  await gotoAdjustWithStudent(p, studentId);
  const summaryChip = p.locator(".MuiChip-label").filter({ hasText: balanceText(expected) });
  await summaryChip.waitFor({ state: "visible", timeout: devWaitTimeout });
  await gotoAppRoute(p, CREDITS_PATH);
  await p.getByText(CREDITS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
}

/** Deep-link into the adjust form through the row action (AC-1.4) and verify preselection (AC-1.5). */
async function openAdjustFormForStudent(p: Page, studentName: string): Promise<void> {
  const row = p.locator(".MuiDataGrid-row").filter({ hasText: studentName }).first();
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  await row.getByRole("button", { name: ADJUST_BUTTON }).click();
  await p.waitForURL(url => url.pathname === ADJUST_PATH && url.searchParams.has("studentId"), {
    timeout: devWaitTimeout,
  });
  await p.getByText(studentName, { exact: true }).first().waitFor({ state: "visible", timeout: devWaitTimeout });
}

/**
 * Direct deep-link once the studentId is known — keeps repeated visits on the
 * exact same student. Waits on the always-present hours field (the name
 * summary needs the studentById round-trip, which can be slow under load);
 * AC-1.5 preselection is asserted on the first button-driven visit instead.
 */
async function gotoAdjustWithStudent(p: Page, studentId: string): Promise<void> {
  await gotoAppRoute(p, `${ADJUST_PATH}?studentId=${studentId}`);
  const hoursInput = p.getByLabel(HOURS_LABEL);
  await hoursInput.waitFor({ state: "visible", timeout: devWaitTimeout });
}

/** Dismiss any open Toolpad/MUI snackbar so the next notification can surface. */
async function dismissOpenNotifications(p: Page): Promise<void> {
  const closeButton = p.locator(".MuiSnackbar-root .MuiIconButton-root:visible").first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}

async function isRadioChecked(p: Page, value: string): Promise<boolean> {
  return p.locator(`input[type="radio"][value="${value}"]`).isChecked();
}

async function clickCardUntilChecked(card: Locator, isChecked: () => Promise<boolean>, attempt: number): Promise<void> {
  if (attempt > 8) {
    throw new Error("radio card click never registered (checked state did not flip)");
  }
  await card.click();
  if (await isChecked()) return;
  await clickCardUntilChecked(card, isChecked, attempt + 1);
}

async function selectAdjustmentType(
  p: Page,
  cardName: RegExp,
  value: "ADD" | "SUBTRACT" | "SUBTRACT_WITH_CARRYOVER"
): Promise<void> {
  const card = p.locator(".MuiFormControlLabel-root").filter({ hasText: cardName }).first();
  await card.waitFor({ state: "visible", timeout: devWaitTimeout });
  // Hydration-safe: on a freshly loaded page a click can land before React
  // attaches its handlers, so verify the store-driven checked state and retry.
  await clickCardUntilChecked(card, () => isRadioChecked(p, value), 1);
}

async function fillHoursAndReason(p: Page, hours: number): Promise<void> {
  const hoursInput = p.getByLabel(HOURS_LABEL);
  await hoursInput.waitFor({ state: "visible", timeout: devWaitTimeout });
  await hoursInput.fill(String(hours));
  const reason = p.getByRole("textbox", { name: REASON_LABEL });
  await reason.waitFor({ state: "visible", timeout: devWaitTimeout });
  await reason.click();
  await reason.pressSequentially(E2E_REASON);
}

async function submitAndReturnToList(p: Page, toastPattern: RegExp): Promise<void> {
  await dismissOpenNotifications(p);
  await p.getByRole("button", { name: ADJUST_BUTTON }).click();
  await expectToast(p, toastPattern);
  await p.waitForURL(url => url.pathname === CREDITS_PATH, { timeout: devWaitTimeout });
}

/** Masked date inputs (MUI X contenteditable sections) accept digit-by-digit entry (dd/MM/yyyy in the default ar locale). */
async function fillDateField(p: Page, label: RegExp, date: Date): Promise<void> {
  const field = p.getByLabel(label).first();
  await field.waitFor({ state: "visible", timeout: devWaitTimeout });
  await field.click();
  const digits = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
  await field.pressSequentially(digits);
  await p.keyboard.press("Escape");
  // Not a native input (contenteditable sections), so read the rendered value.
  expect((await field.textContent()) ?? "").toContain(String(date.getFullYear()));
}

const pageConsoleErrors: string[] = [];

async function loginAtRoute(groupSlug: string, route: string): Promise<Page> {
  context = await createContext();
  const newPage = await context.newPage();
  page = newPage;
  pageConsoleErrors.length = 0;
  newPage.on("console", message => {
    if (message.type() === "error") pageConsoleErrors.push(message.text().slice(0, 300));
  });
  newPage.on("pageerror", error => pageConsoleErrors.push(`pageerror: ${error.message}`.slice(0, 300)));
  await loginAsDemoUserAtRoute(newPage, context, groupSlug, route);
  return newPage;
}

/** Best-effort context dump when the multi-step flow fails mid-way. */
async function dumpFlowDiagnostics(p: Page, step: string): Promise<void> {
  // Each read is individually guarded: this runs from catch blocks where the page
  // is often mid-navigation (e.g. post-submit redirect), and an unguarded
  // locator read would throw "Execution context was destroyed" and mask the
  // original assertion failure.
  const readTexts = (selector: string): Promise<string[]> =>
    p
      .locator(selector)
      .allTextContents()
      .catch(() => ["<unavailable: page navigating>"]);
  const chips = await readTexts(".MuiChip-label");
  const snackbars = await readTexts(".MuiSnackbar-root, .MuiAlert-root, [role='alert']");
  const body = await p
    .locator("body")
    .innerText()
    .catch(() => "<unavailable: page navigating>");
  await p.screenshot({ path: `scratch/screenshots/credit-adjustment-failure-${step}.png` }).catch(() => undefined);
  testLogger.error("credit-adjustment e2e flow failed", {
    step,
    url: p.url(),
    chips,
    snackbars,
    consoleErrors: pageConsoleErrors.slice(0, 10),
    bodySample: body.slice(0, 500),
  });
}

describe.serial("Accounting Credits E2E", () => {
  beforeAll(async () => {
    // Dev-mode first-visit Turbopack compile of the credits route tree can
    // exceed the per-assertion `devWaitTimeout` — especially while a concurrent
    // workstream edits the accounting sources (invalidating the compile cache)
    // and the runner spawn skips E2E_WARMUP_ROUTES on file-scoped invocations.
    // One readiness fetch per route pre-compiles both up front (unauthenticated
    // requests redirect to /login but still compile the route tree). No fixed
    // sleep: each fetch waits on a real HTTP response.
    if (process.env.TEST_SERVER_MODE === "production") return;
    await Promise.all(
      [CREDITS_PATH, ADJUST_PATH].map(route =>
        fetch(`${getTestBaseUrl()}${route}`, {
          redirect: "follow",
          signal: AbortSignal.timeout(240_000),
        }).catch(error => {
          testLogger.warn("credits route pre-warm failed (assertions still apply)", {
            route,
            error: error instanceof Error ? error.message : String(error),
          });
        })
      )
    );
  }, 500_000);

  test("snapshot files exist for both locales (EN + AR)", () => {
    // 3.6 acceptance: the compile-time snapshots the client loader fetches at runtime.
    expect(existsSync("public/static/locale-snapshots/en/dashboard.billing.creditAdjustment.json")).toBe(true);
    expect(existsSync("public/static/locale-snapshots/ar/dashboard.billing.creditAdjustment.json")).toBe(true);
  });

  test("operator with permission: list renders, rows actionable, sidebar item present (AC-1.1, AC-1.3, AC-1.6)", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CREDITS_PATH);
    try {
      await p.getByText(CREDITS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
      const headerAction = p.getByRole("link", { name: ADJUST_BUTTON }).first();
      await headerAction.waitFor({ state: "attached", timeout: devWaitTimeout });
      const firstRow = p.locator(".MuiDataGrid-row").first();
      await firstRow.waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await firstRow.getByRole("button", { name: ADJUST_BUTTON }).count()).toBeGreaterThan(0);

      const creditsLink = p.getByRole("link", { name: CREDITS_NAV_LINK }).first();
      await creditsLink.waitFor({ state: "visible", timeout: devWaitTimeout });
    } catch (error) {
      await dumpFlowDiagnostics(p, "list-render");
      throw error;
    }
  });

  test("user without permission: redirected away and sidebar item hidden (AC-1.2, AC-1.6)", async () => {
    const p = await loginAtRoute(DEMO_USERS.teacher.groupSlug, CREDITS_PATH);
    await p.waitForURL(url => !url.pathname.startsWith(CREDITS_PATH), { timeout: devWaitTimeout });
    expect(new URL(p.url()).pathname.startsWith(CREDITS_PATH)).toBe(false);

    await p.locator("nav a").first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await p.getByRole("link", { name: CREDITS_NAV_LINK }).count()).toBe(0);
  });

  test("operator flow: add, subtract, subtract with carryover (AC-2.x, AC-3.x, AC-4.x, AC-2.6)", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CREDITS_PATH);
    let step = "list-render";
    try {
      await p.getByText(CREDITS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
      const target = await pickUniqueStudent(p);
      const studentName = target.name;
      const balance = { ...target.balance };

      // Server-side idempotency keys are derived from (studentId, type, hours,
      // carryover fields) — notes are deliberately excluded. Per-run-varying
      // hours keep reruns from replaying an earlier run's ledger row, and
      // ADD = SUBTRACT + CARRYOVER keeps the demo balance a net-zero no-op.
      const addHours = 2 + (Math.floor(Date.now() / 60_000) % 30);
      const subtractHours = Math.ceil(addHours / 2);
      const carryoverHours = addHours - subtractHours;

      // Add — increments both remaining and total.
      step = "add";
      await openAdjustFormForStudent(p, studentName);
      const studentId = new URL(p.url()).searchParams.get("studentId") ?? "";
      expect(studentId.length).toBeGreaterThan(0);
      await fillHoursAndReason(p, addHours);
      await submitAndReturnToList(p, exactText(credits.success.added(addHours)));
      balance.remaining += addHours;
      balance.total += addHours;
      step = "add.verify-balance";
      await verifyBalanceAfterSubmit(p, studentName, studentId, balance);

      // Subtract — decrements remaining only.
      step = "subtract";
      await gotoAdjustWithStudent(p, studentId);
      await selectAdjustmentType(p, SUBTRACT_CARD, "SUBTRACT");
      await fillHoursAndReason(p, subtractHours);
      await submitAndReturnToList(p, exactText(credits.success.subtracted(subtractHours)));
      balance.remaining -= subtractHours;
      step = "subtract.verify-balance";
      await verifyBalanceAfterSubmit(p, studentName, studentId, balance);

      // Subtract with carryover — decrements remaining; carryover section required.
      step = "carryover";
      await gotoAdjustWithStudent(p, studentId);
      await selectAdjustmentType(p, CARRYOVER_CARD, "SUBTRACT_WITH_CARRYOVER");
      await p.getByText(CARRYOVER_BANNER_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });

      const teacherInput = p.getByLabel(TEACHER_LABEL).first();
      await teacherInput.waitFor({ state: "visible", timeout: devWaitTimeout });
      await teacherInput.click();
      const firstTeacherOption = p.getByRole("option").first();
      await firstTeacherOption.waitFor({ state: "visible", timeout: devWaitTimeout });
      await firstTeacherOption.click();

      const today = new Date();
      await fillDateField(p, FROM_DATE_LABEL, today);
      await fillDateField(p, TO_DATE_LABEL, today);
      await fillDateField(p, PAYMENT_DATE_LABEL, today);

      await fillHoursAndReason(p, carryoverHours);
      // Success toast names the teacher; fall back to the plain subtracted copy if the
      // client cannot resolve the teacher display name (degraded-by-design branch).
      const carryoverToast = new RegExp(
        `${escapeRegExp(credits.success.carryover(carryoverHours, ""))}|${exactText(credits.success.subtracted(carryoverHours)).source}`
      );
      await submitAndReturnToList(p, carryoverToast);
      balance.remaining -= carryoverHours;
      step = "carryover.verify-balance";
      await verifyBalanceAfterSubmit(p, studentName, studentId, balance);
    } catch (error) {
      await dumpFlowDiagnostics(p, step);
      throw error;
    }
  });
});
