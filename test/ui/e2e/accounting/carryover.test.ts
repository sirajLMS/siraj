import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { BrowserContext, Locator, Page } from "playwright";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getDefaultTranslations } from "@/shared/locale/server";
import { getTestBaseUrl } from "@/test/helpers";
import { closeE2eSession, DEMO_USERS, devWaitTimeout, loginAsDemoUserAtRoute } from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const exactText = (s: string): RegExp => new RegExp(`^${escapeRegExp(s)}$`, "i");

const T = getDefaultTranslations().dashboardTranslations;
const carryover = T.accountingCarryover;
const nav = T.coreNav;

const CARRYOVER_PATH = "/accounting/carryover";
const EXPORT_DIR = "scratch/e2e";

const SNAPSHOT_FILES = [
  "public/static/locale-snapshots/en/dashboard.accounting.carryover.json",
  "public/static/locale-snapshots/ar/dashboard.accounting.carryover.json",
] as const;

// Stable toolbar ids exposed by the grid for test addressing.
const ADD_NEW_BUTTON = "#carryover-add-new";
const BULK_TO_EXPENSE_BUTTON = "#carryover-bulk-to-expense";
const EXPORT_CSV_BUTTON = "#carryover-export-csv";
/** Per-row overflow menu trigger (id carries the row id as a suffix). */
const ROW_ACTIONS_SELECTOR = "button[id^='carryover-row-actions-']";

/** Fixed CSV header contract of the export route (row-contract declaration order). */
const CSV_HEADER_COLUMNS = [
  "id",
  "teacherId",
  "teacherName",
  "teacherAvatarUrl",
  "studentsCount",
  "studentsText",
  "totalDuration",
  "payable",
  "teacherCurrency",
  "paid",
  "fromDate",
  "toDate",
  "paymentDate",
  "isDisabledTeacher",
  "isPaid",
  "expenseId",
  "note",
  "createdAt",
  "paidAt",
] as const;

const PAGE_TITLE = new RegExp(escapeRegExp(carryover.title));
const NAV_LINK = new RegExp(escapeRegExp(nav.accountingCarryover));
const PAID_CHIP = exactText(carryover.chip.paid);
const UNPAID_CHIP = exactText(carryover.chip.unpaid);

const FORM_TITLE = new RegExp(escapeRegExp(carryover.modal.form.titleAdd));
const FORM_TEACHER_LABEL = new RegExp(escapeRegExp(carryover.modal.form.teacher));
const FORM_CURRENCY_LABEL = new RegExp(escapeRegExp(carryover.modal.form.currency));
const FORM_FROM_LABEL = new RegExp(escapeRegExp(carryover.modal.form.fromDate));
const FORM_TO_LABEL = new RegExp(escapeRegExp(carryover.modal.form.toDate));
const FORM_PAYABLE_LABEL = new RegExp(escapeRegExp(carryover.modal.form.payable));
const FORM_STUDENTS_TEXT_LABEL = new RegExp(escapeRegExp(carryover.modal.form.studentsText));
const FORM_SUBMIT = exactText(carryover.modal.form.submit);
const CREATED_TOAST = exactText(carryover.success.created);

const BULK_TITLE = new RegExp(escapeRegExp(carryover.modal.bulkToExpense.title));
const BULK_PAYMENT_DATE_LABEL = new RegExp(escapeRegExp(carryover.modal.bulkToExpense.paymentDate));
const BULK_SUBMIT = exactText(carryover.modal.bulkToExpense.submit);
const BULK_SUCCESS_TOAST = exactText(carryover.success.bulkedToExpense(2));

const UNPAY_MENU_ITEM = exactText(carryover.action.unpay);
const UNPAY_TITLE = new RegExp(escapeRegExp(carryover.modal.unpay.title));
const UNPAY_CONFIRM = exactText(carryover.modal.unpay.confirm);
const UNPAID_TOAST = exactText(carryover.success.unpaid);

const DELETE_MENU_ITEM = exactText(carryover.action.delete);
const DELETE_TITLE = new RegExp(escapeRegExp(carryover.modal.delete.title));
const DELETE_CONFIRM = exactText(carryover.modal.delete.confirm);
const DELETED_TOAST = exactText(carryover.success.deleted);

/**
 * Test input data (operator-typed record attributes), not rendered
 * translations. The per-run studentsText tokens locate the two records the
 * flow creates regardless of what other suite runs left in the list; the
 * payable amounts identify the records' rows in the CSV export.
 */
const RUN_SUFFIX = Date.now().toString(36);
const TOKEN_FIRST = `E2ECO-${RUN_SUFFIX}-A`;
const TOKEN_SECOND = `E2ECO-${RUN_SUFFIX}-B`;
const PAYABLE_FIRST = 300 + (Date.now() % 400);
const PAYABLE_SECOND = PAYABLE_FIRST + 97;

let context: BrowserContext | undefined;
let page: Page | undefined;

afterEach(async () => {
  await closeE2eSession(page, context);
  page = undefined;
  context = undefined;
}, 30_000);

async function loginAtRoute(groupSlug: string, route: string): Promise<Page> {
  context = await createContext();
  const newPage = await context.newPage();
  page = newPage;
  await loginAsDemoUserAtRoute(newPage, context, groupSlug, route);
  return newPage;
}

/** Locates one grid row by the unique studentsText token of a flow-created record. */
function rowByToken(p: Page, token: string): Locator {
  return p.locator(".MuiDataGrid-row").filter({ hasText: token }).first();
}

async function waitForRow(p: Page, token: string): Promise<Locator> {
  const row = rowByToken(p, token);
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  return row;
}

/** Asserts the row carries the Paid/Unpaid status chip with the given label. */
async function expectRowChip(row: Locator, chipPattern: RegExp): Promise<void> {
  const chip = row.locator(".MuiChip-label").filter({ hasText: chipPattern }).first();
  await chip.waitFor({ state: "visible", timeout: devWaitTimeout });
}

async function expectToast(p: Page, pattern: RegExp): Promise<void> {
  const toast = p.getByText(pattern).first();
  await toast.waitFor({ state: "visible", timeout: devWaitTimeout });
}

/** Dismiss any open Toolpad/MUI snackbar so the next toolbar click is not covered. */
async function dismissOpenNotifications(p: Page): Promise<void> {
  const closeButton = p.locator(".MuiSnackbar-root .MuiIconButton-root:visible").first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}

/** Opens a labelled autocomplete inside the dialog and picks the option at the given index. */
async function pickAutocompleteOption(p: Page, dialog: Locator, label: RegExp, optionIndex: number): Promise<void> {
  const input = dialog.getByLabel(label).first();
  await input.waitFor({ state: "visible", timeout: devWaitTimeout });
  await input.click();
  const options = p.getByRole("option");
  await options.first().waitFor({ state: "visible", timeout: devWaitTimeout });
  expect(await options.count()).toBeGreaterThan(optionIndex);
  await options.nth(optionIndex).click();
}

/** Masked date inputs (MUI X contenteditable sections) accept digit-by-digit entry (dd/MM/yyyy in the default ar locale). */
async function fillMaskedDate(scope: Page | Locator, p: Page, label: RegExp, date: Date): Promise<void> {
  const field = scope.getByLabel(label).first();
  await field.waitFor({ state: "visible", timeout: devWaitTimeout });
  await field.click();
  const digits = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
  await field.pressSequentially(digits);
  await p.keyboard.press("Escape");
  // Not a native input (contenteditable sections), so read the rendered value.
  expect((await field.textContent()) ?? "").toContain(String(date.getFullYear()));
}

/** Quote-aware single-line CSV parser matching the export route escaping rules. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let index = 0;
  while (index < line.length) {
    const char = line[index];
    index += 1;
    if (inQuotes) {
      if (char === '"' && line[index] !== '"') {
        inQuotes = false;
      } else if (char === '"') {
        // Escaped quote: consume the second quote character as cell content.
        cell += '"';
        index += 1;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      cells.push(cell);
      cell = "";
      continue;
    }
    cell += char;
  }
  cells.push(cell);
  return cells;
}

/** Submits one Add New form: teacher by option index, first currency, today as the period, payable and token. */
async function createCarryoverViaForm(
  p: Page,
  teacherOptionIndex: number,
  payable: number,
  token: string
): Promise<void> {
  await dismissOpenNotifications(p);
  await p.locator(ADD_NEW_BUTTON).click();
  const dialog = p.getByRole("dialog").filter({ hasText: FORM_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await pickAutocompleteOption(p, dialog, FORM_TEACHER_LABEL, teacherOptionIndex);
  await pickAutocompleteOption(p, dialog, FORM_CURRENCY_LABEL, 0);
  const today = new Date();
  await fillMaskedDate(dialog, p, FORM_FROM_LABEL, today);
  await fillMaskedDate(dialog, p, FORM_TO_LABEL, today);
  await dialog.getByLabel(FORM_PAYABLE_LABEL).fill(String(payable));
  await dialog.getByLabel(FORM_STUDENTS_TEXT_LABEL).fill(token);
  await dialog.getByRole("button", { name: FORM_SUBMIT }).click();
  await expectToast(p, CREATED_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
}

/** Creates the two flow records (different teachers) and waits for both grid rows. */
async function createBothCarryovers(p: Page): Promise<void> {
  await createCarryoverViaForm(p, 0, PAYABLE_FIRST, TOKEN_FIRST);
  await createCarryoverViaForm(p, 1, PAYABLE_SECOND, TOKEN_SECOND);
  await waitForRow(p, TOKEN_FIRST);
  await waitForRow(p, TOKEN_SECOND);
}

/** Selects both rows, converts them to expenses, and waits for the Paid chips on both. */
async function convertBothToExpense(p: Page): Promise<void> {
  const rowFirst = await waitForRow(p, TOKEN_FIRST);
  const rowSecond = await waitForRow(p, TOKEN_SECOND);
  await rowFirst.getByRole("checkbox").click();
  await rowSecond.getByRole("checkbox").click();
  await p.locator(BULK_TO_EXPENSE_BUTTON).click();
  const dialog = p.getByRole("dialog").filter({ hasText: BULK_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  // The expense month picker auto-seeds from the chosen payment date while empty.
  await fillMaskedDate(dialog, p, BULK_PAYMENT_DATE_LABEL, new Date());
  await dialog.getByRole("button", { name: BULK_SUBMIT }).click();
  await expectToast(p, BULK_SUCCESS_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  await expectRowChip(await waitForRow(p, TOKEN_FIRST), PAID_CHIP);
  await expectRowChip(await waitForRow(p, TOKEN_SECOND), PAID_CHIP);
}

/** Unpays one row through its overflow menu and waits for the Unpaid chip. */
async function unpayRowByToken(p: Page, token: string): Promise<void> {
  await dismissOpenNotifications(p);
  const row = await waitForRow(p, token);
  await row.locator(ROW_ACTIONS_SELECTOR).click();
  await p.getByRole("menuitem", { name: UNPAY_MENU_ITEM }).click();
  const dialog = p.getByRole("dialog").filter({ hasText: UNPAY_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await dialog.getByRole("button", { name: UNPAY_CONFIRM }).click();
  await expectToast(p, UNPAID_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  await expectRowChip(await waitForRow(p, token), UNPAID_CHIP);
}

/** Deletes one (unpaid) row through its overflow menu and confirms the dialog. */
async function deleteRowByToken(p: Page, token: string): Promise<void> {
  await dismissOpenNotifications(p);
  const row = await waitForRow(p, token);
  await row.locator(ROW_ACTIONS_SELECTOR).click();
  await p.getByRole("menuitem", { name: DELETE_MENU_ITEM }).click();
  const dialog = p.getByRole("dialog").filter({ hasText: DELETE_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await dialog.getByRole("button", { name: DELETE_CONFIRM }).click();
  await expectToast(p, DELETED_TOAST);
}

/** Finds the CSV data row of one flow record by its studentsText token. */
function findCsvRow(csvLines: readonly string[], token: string): string[] {
  const studentsTextIndex = CSV_HEADER_COLUMNS.indexOf("studentsText");
  for (const line of csvLines.slice(1)) {
    const cells = parseCsvLine(line);
    if (cells[studentsTextIndex] === token) return cells;
  }
  throw new Error(`CSV export is missing the row with studentsText token: ${token}`);
}

/**
 * Exports the CSV, saves the download, and asserts: fixed column contract,
 * one row per flow record with its payable amount, and the isPaid column
 * mirroring the grid state at export time (first row unpaid, second paid).
 */
async function verifyCsvExport(p: Page): Promise<void> {
  await dismissOpenNotifications(p);
  const exportButton = p.locator(EXPORT_CSV_BUTTON);
  await exportButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  const downloadPromise = p.waitForEvent("download", { timeout: devWaitTimeout });
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^carryover-balances-\d{4}-\d{2}-\d{2}\.csv$/);

  mkdirSync(EXPORT_DIR, { recursive: true });
  const exportPath = `${EXPORT_DIR}/carryover-balances-${RUN_SUFFIX}.csv`;
  await download.saveAs(exportPath);

  const csvLines = readFileSync(exportPath, "utf8")
    .split("\r\n")
    .filter(line => line.length > 0);
  expect(csvLines.length).toBeGreaterThan(1);
  expect(parseCsvLine(csvLines[0])).toEqual([...CSV_HEADER_COLUMNS]);

  const isPaidIndex = CSV_HEADER_COLUMNS.indexOf("isPaid");
  const payableIndex = CSV_HEADER_COLUMNS.indexOf("payable");
  const paymentDateIndex = CSV_HEADER_COLUMNS.indexOf("paymentDate");

  const firstRow = findCsvRow(csvLines, TOKEN_FIRST);
  expect(firstRow[isPaidIndex]).toBe("false");
  expect(firstRow[payableIndex]).toBe(`${PAYABLE_FIRST}.00`);

  const secondRow = findCsvRow(csvLines, TOKEN_SECOND);
  expect(secondRow[isPaidIndex]).toBe("true");
  expect(secondRow[payableIndex]).toBe(`${PAYABLE_SECOND}.00`);
  expect((secondRow[paymentDateIndex] ?? "").length).toBeGreaterThan(0);
}

describe.serial("Accounting Carryover E2E", () => {
  beforeAll(async () => {
    // Dev-mode first-visit Turbopack compile of the carryover route tree can
    // exceed the per-assertion devWaitTimeout. One readiness fetch pre-compiles
    // the route up front (unauthenticated requests redirect but still compile).
    if (process.env.TEST_SERVER_MODE === "production") return;
    await fetch(`${getTestBaseUrl()}${CARRYOVER_PATH}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(240_000),
    }).catch(error => {
      testLogger.warn("carryover route pre-warm failed (assertions still apply)", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, 500_000);

  test("locale snapshot files exist for both locales (EN + AR)", () => {
    for (const snapshotFile of SNAPSHOT_FILES) {
      expect(existsSync(snapshotFile)).toBe(true);
    }
  });

  test("operator with permission: page renders with toolbar actions and sidebar item present", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CARRYOVER_PATH);

    await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
    await p.locator(ADD_NEW_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });
    await p.locator(BULK_TO_EXPENSE_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });
    await p.locator(EXPORT_CSV_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });

    const carryoverLink = p.getByRole("link", { name: NAV_LINK }).first();
    await carryoverLink.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await carryoverLink.count()).toBeGreaterThan(0);
  });

  test("user without permission: redirected away and sidebar item hidden", async () => {
    const p = await loginAtRoute(DEMO_USERS.teacher.groupSlug, CARRYOVER_PATH);
    await p.waitForURL(url => !url.pathname.startsWith(CARRYOVER_PATH), { timeout: devWaitTimeout });
    expect(new URL(p.url()).pathname.startsWith(CARRYOVER_PATH)).toBe(false);

    await p.locator("nav a").first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await p.getByRole("link", { name: NAV_LINK }).count()).toBe(0);
  });

  /**
   * Operator journey: two records (one per teacher), bulk convert both to
   * expenses, unpay one, export CSV, then clean up both records. The audit
   * report's bulk-carryover entry point is not shipped yet, so creation goes
   * through the page's own Add New form — the bulk-create resolver itself is
   * covered by the GraphQL mutation tests. The expense-ledger page assertion
   * is likewise deferred until the expense surface exists.
   */
  test("operator flow: add two carryovers, bulk to expense, unpay one, CSV export, cleanup", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CARRYOVER_PATH);
    await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });

    let createdFirst = false;
    let createdSecond = false;
    try {
      await createBothCarryovers(p);
      createdFirst = true;
      createdSecond = true;

      await convertBothToExpense(p);
      await unpayRowByToken(p, TOKEN_FIRST);
      await verifyCsvExport(p);
    } finally {
      // Cleanup keeps the demo dataset stable for follow-up runs: paid
      // records must be unpaid before they can be deleted.
      if (createdFirst && createdSecond) {
        try {
          await dismissOpenNotifications(p);
          const secondRow = await waitForRow(p, TOKEN_SECOND);
          const stillPaid = (await secondRow.locator(".MuiChip-label").filter({ hasText: PAID_CHIP }).count()) > 0;
          if (stillPaid) await unpayRowByToken(p, TOKEN_SECOND);
          await deleteRowByToken(p, TOKEN_FIRST);
          await deleteRowByToken(p, TOKEN_SECOND);
        } catch (cleanupError) {
          testLogger.warn("carryover e2e cleanup failed; records left in place", {
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          });
        }
      }
    }
  }, 600_000);
});
