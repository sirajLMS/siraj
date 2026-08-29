import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import type { BrowserContext, Page } from "playwright";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getDefaultTranslations } from "@/shared/locale/server";
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
 * A per-run suffix keeps repeated runs from collapsing onto the same
 * server-derived idempotency key (same student + type + hours + notes would
 * otherwise replay the first submission without changing the balance).
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
 */
async function pickUniqueStudent(p: Page): Promise<StudentTarget> {
  const rows = p.locator(".MuiDataGrid-row");
  await rows.first().waitFor({ state: "visible", timeout: devWaitTimeout });
  const names = await rows.evaluateAll(elements =>
    elements.map(element => element.querySelector("p")?.textContent?.trim() ?? "")
  );
  const seen = new Map<string, number>();
  for (const name of names) seen.set(name, (seen.get(name) ?? 0) + 1);
  const uniqueName = names.find(name => name.length > 0 && seen.get(name) === 1);
  // Degenerate environment: every visible name is duplicated — fall back to
  // the first row rather than skipping the whole flow.
  const studentName = uniqueName ?? names[0] ?? "";
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

async function selectAdjustmentType(p: Page, cardName: RegExp): Promise<void> {
  const card = p.locator(".MuiFormControlLabel-root").filter({ hasText: cardName }).first();
  await card.waitFor({ state: "visible", timeout: devWaitTimeout });
  await card.click();
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

/** Masked date inputs accept digit-by-digit entry (dd/MM/yyyy in the default ar locale). */
async function fillDateField(p: Page, label: RegExp, date: Date): Promise<void> {
  const input = p.getByLabel(label).first();
  await input.waitFor({ state: "visible", timeout: devWaitTimeout });
  await input.click();
  const digits = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
  await input.pressSequentially(digits);
  await p.keyboard.press("Escape");
  expect((await input.inputValue()).trim().length).toBeGreaterThan(0);
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
  const chips = await p.locator(".MuiChip-label").allTextContents();
  const snackbars = await p.locator(".MuiSnackbar-root, .MuiAlert-root, [role='alert']").allTextContents();
  const body = await p.locator("body").innerText();
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
  test("snapshot files exist for both locales (EN + AR)", () => {
    // 3.6 acceptance: the compile-time snapshots the client loader fetches at runtime.
    expect(existsSync("public/static/locale-snapshots/en/dashboard.billing.creditAdjustment.json")).toBe(true);
    expect(existsSync("public/static/locale-snapshots/ar/dashboard.billing.creditAdjustment.json")).toBe(true);
  });

  test("operator with permission: list renders, rows actionable, sidebar item present (AC-1.1, AC-1.3, AC-1.6)", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CREDITS_PATH);

    await p.getByText(CREDITS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
    const headerAction = p.getByRole("link", { name: ADJUST_BUTTON }).first();
    await headerAction.waitFor({ state: "attached", timeout: devWaitTimeout });
    const firstRow = p.locator(".MuiDataGrid-row").first();
    await firstRow.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await firstRow.getByRole("button", { name: ADJUST_BUTTON }).count()).toBeGreaterThan(0);

    const creditsLink = p.getByRole("link", { name: CREDITS_NAV_LINK }).first();
    await creditsLink.waitFor({ state: "visible", timeout: devWaitTimeout });
  });

  test("user without permission: redirected away and sidebar item hidden (AC-1.2, AC-1.6)", async () => {
    const p = await loginAtRoute(DEMO_USERS.teacher.groupSlug, CREDITS_PATH);
    await p.waitForURL(url => !url.pathname.startsWith(CREDITS_PATH), { timeout: devWaitTimeout });
    expect(new URL(p.url()).pathname.startsWith(CREDITS_PATH)).toBe(false);

    await p.locator("nav a").first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await p.getByRole("link", { name: CREDITS_NAV_LINK }).count()).toBe(0);
  });

  test("operator flow: add 2, subtract 1, subtract 1 with carryover (AC-2.x, AC-3.x, AC-4.x, AC-2.6)", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CREDITS_PATH);
    let step = "list-render";
    try {
      await p.getByText(CREDITS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
      const target = await pickUniqueStudent(p);
      const studentName = target.name;
      const balance = { ...target.balance };

      // Add +2 hours — increments both remaining and total.
      step = "add+2";
      await openAdjustFormForStudent(p, studentName);
      const studentId = new URL(p.url()).searchParams.get("studentId") ?? "";
      expect(studentId.length).toBeGreaterThan(0);
      await fillHoursAndReason(p, 2);
      await submitAndReturnToList(p, exactText(credits.success.added(2)));
      balance.remaining += 2;
      balance.total += 2;
      step = "add+2.verify-balance";
      await searchForStudent(p, studentName);
      await verifyBalanceAfterSubmit(p, studentName, studentId, balance);

      // Subtract 1 hour — decrements remaining only.
      step = "subtract-1";
      await gotoAdjustWithStudent(p, studentId);
      await selectAdjustmentType(p, SUBTRACT_CARD);
      await fillHoursAndReason(p, 1);
      await submitAndReturnToList(p, exactText(credits.success.subtracted(1)));
      balance.remaining -= 1;
      step = "subtract-1.verify-balance";
      await searchForStudent(p, studentName);
      await verifyBalanceAfterSubmit(p, studentName, studentId, balance);

      // Subtract 1 hour with carryover — decrements remaining; carryover section required.
      step = "carryover-1";
      await gotoAdjustWithStudent(p, studentId);
      await selectAdjustmentType(p, CARRYOVER_CARD);
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

      await fillHoursAndReason(p, 1);
      // Success toast names the teacher; fall back to the plain subtracted copy if the
      // client cannot resolve the teacher display name (degraded-by-design branch).
      const carryoverToast = new RegExp(
        `${escapeRegExp(credits.success.carryover(1, ""))}|${exactText(credits.success.subtracted(1)).source}`
      );
      await submitAndReturnToList(p, carryoverToast);
      balance.remaining -= 1;
      step = "carryover-1.verify-balance";
      await searchForStudent(p, studentName);
      await verifyBalanceAfterSubmit(p, studentName, studentId, balance);
    } catch (error) {
      await dumpFlowDiagnostics(p, step);
      throw error;
    }
  });
});
