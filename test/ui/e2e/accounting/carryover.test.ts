import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
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
const carryover = T.accountingCarryover;
const audit = T.sessionAudit;
const payroll = T.billingPayroll;
const nav = T.coreNav;

const REPORTS_PATH = "/accounting/reports";
const CARRYOVER_PATH = "/accounting/carryover";
const EXPORT_DIR = "scratch/e2e";

const SNAPSHOT_FILES = [
  "public/static/locale-snapshots/en/dashboard.accounting.carryover.json",
  "public/static/locale-snapshots/ar/dashboard.accounting.carryover.json",
] as const;

// Stable toolbar ids exposed by the grids for test addressing.
const ADD_NEW_BUTTON = "#carryover-add-new";
const BULK_TO_EXPENSE_BUTTON = "#carryover-bulk-to-expense";
const EXPORT_CSV_BUTTON = "#carryover-export-csv";
const AUDIT_BULK_BUTTON = "#session-audit-bulk-carryover";
/** Per-row overflow menu trigger (id carries the row id as a suffix). */
const ROW_ACTIONS_SELECTOR = "button[id^='carryover-row-actions-']";

/** Audit grid cells addressed by their stable data-field names. */
const AUDIT_STATUS_CELL = "div[data-field='calculationStatus']";
const AUDIT_LINK_CELL = "div[data-field='carryoverLink']";
const AUDIT_TEACHER_CELL = "div[data-field='teacherName']";

/** Carryover detail-drawer deep link rendered by the audit grid's Linked chip. */
const CARRYOVER_DETAIL_URL = /\/accounting\/carryover\/([0-9a-f-]+)/i;

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

type CsvColumn = (typeof CSV_HEADER_COLUMNS)[number];

const PAGE_TITLE = new RegExp(escapeRegExp(carryover.title));
const NAV_LINK = new RegExp(escapeRegExp(nav.accountingCarryover));
const PAID_CHIP = exactText(carryover.chip.paid);
const UNPAID_CHIP = exactText(carryover.chip.unpaid);

const AUDIT_PAGE_TITLE = new RegExp(escapeRegExp(audit.title));
const AUDIT_BULK_DIALOG_TITLE = new RegExp(escapeRegExp(audit.carryover.dialog.title));
const AUDIT_BULK_CONFIRM = exactText(audit.carryover.dialog.confirm);
const AUDIT_LINKED_CHIP = exactText(audit.carryover.linkedChip);
const AUDIT_CREATED_TOAST = exactText(carryover.success.bulkCreated(2));
/** Lowercased calculation chips whose sessions the bulk-create resolver accepts. */
const AUDITED_STATUS_TEXTS = new Set(
  [payroll.status.CALCULATED, payroll.status.PARTIALLY, payroll.status.REFUND].map(label => label.trim().toLowerCase())
);

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
 * CRUD-complement flow creates via the Add New form, regardless of what other
 * suite runs left in the list; the payable amounts identify the records' rows
 * in the CSV export.
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

/** Locates the audit grid row of one session by its instance id (the grid's getRowId). */
function auditRowByInstanceId(p: Page, instanceId: string): Locator {
  return p.locator(`.MuiDataGrid-row[data-id="${instanceId}"]`).first();
}

/** Locates one carryover board row by the record id the grid exposes as data-id. */
function carryoverRowById(p: Page, carryoverId: string): Locator {
  return p.locator(`.MuiDataGrid-row[data-id="${carryoverId}"]`).first();
}

async function waitForCarryoverRow(p: Page, carryoverId: string): Promise<Locator> {
  const row = carryoverRowById(p, carryoverId);
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  return row;
}

/** An audit row's identity plus carryover-bulk eligibility, read in one parallel pass. */
interface AuditRowSnapshot {
  readonly instanceId: string;
  readonly teacherName: string;
  readonly eligible: boolean;
}

/**
 * Eligibility: the session is audited (Calculated / Partially / Refund
 * calculation chip) and not yet linked (no Linked chip in the carryover
 * column).
 */
async function readAuditRowSnapshot(row: Locator): Promise<AuditRowSnapshot> {
  const [instanceId, teacherCell, statusCell, linkedCount] = await Promise.all([
    row.getAttribute("data-id"),
    row.locator(AUDIT_TEACHER_CELL).textContent(),
    row.locator(`${AUDIT_STATUS_CELL} .MuiChip-label`).textContent(),
    row.locator(`${AUDIT_LINK_CELL} .MuiChip-root`).count(),
  ]);
  return {
    instanceId: instanceId ?? "",
    teacherName: (teacherCell ?? "").trim(),
    eligible: AUDITED_STATUS_TEXTS.has((statusCell ?? "").trim().toLowerCase()) && linkedCount === 0,
  };
}

/** One audited, unlinked session row located on the visible report page. */
interface EligibleAuditSession {
  readonly instanceId: string;
  readonly teacherName: string;
}

/** A carryover record created through the audit-grid bulk action. */
interface CreatedCarryoverRef {
  readonly id: string;
  readonly teacherName: string;
}

type RowLookup = (p: Page) => Promise<Locator>;

/**
 * Picks the first two eligible sessions on the visible report page that belong
 * to two distinct teachers. The demo dataset must currently hold such
 * sessions; like the session-audit sibling's requireAbsentRow, the error names
 * the precondition instead of surfacing as a bare wait timeout.
 */
async function pickTwoEligibleSessions(
  p: Page
): Promise<{ first: EligibleAuditSession; second: EligibleAuditSession }> {
  await p.locator(".MuiDataGrid-row").first().waitFor({ state: "visible", timeout: devWaitTimeout });
  const rows = p.locator(".MuiDataGrid-row");
  const rowCount = await rows.count();
  const snapshots = await Promise.all(
    Array.from({ length: rowCount }, (_, index) => readAuditRowSnapshot(rows.nth(index)))
  );
  let first: EligibleAuditSession | null = null;
  for (const snapshot of snapshots) {
    if (!snapshot.eligible || snapshot.instanceId === "" || snapshot.teacherName === "") continue;
    if (first === null) {
      first = { instanceId: snapshot.instanceId, teacherName: snapshot.teacherName };
      continue;
    }
    if (first.teacherName === snapshot.teacherName) continue;
    return { first, second: { instanceId: snapshot.instanceId, teacherName: snapshot.teacherName } };
  }
  throw new Error(
    "No two audited, unlinked sessions from distinct teachers on the first report page — " +
      "seed at least one such session for two teachers in the demo data, then re-run."
  );
}

/**
 * Follows the Linked chip of one audit row into the carryover detail deep
 * link, captures the created record id from the URL, and goes back to the
 * reports page.
 */
async function captureCarryoverIdViaLinkedChip(p: Page, instanceId: string): Promise<string> {
  const row = auditRowByInstanceId(p, instanceId);
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  const chip = row.locator(`${AUDIT_LINK_CELL} .MuiChip-root`).filter({ hasText: AUDIT_LINKED_CHIP }).first();
  await chip.waitFor({ state: "visible", timeout: devWaitTimeout });
  await chip.click();
  await p.waitForURL(CARRYOVER_DETAIL_URL, { timeout: devWaitTimeout });
  const carryoverId = CARRYOVER_DETAIL_URL.exec(new URL(p.url()).pathname)?.[1] ?? "";
  expect(carryoverId.length).toBeGreaterThan(0);
  await p.goBack();
  await p.locator(AUDIT_BULK_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });
  return carryoverId;
}

/** Asserts one per-teacher summary line inside the confirmation dialog. */
async function expectDialogTeacherLine(dialog: Locator, teacherName: string, sessionCount: number): Promise<void> {
  const line = dialog.getByText(exactText(audit.carryover.dialog.teacherLine(teacherName, sessionCount))).first();
  await line.waitFor({ state: "visible", timeout: devWaitTimeout });
}

/**
 * Audit-grid entry: selects the two sessions, opens the Carryover Balance
 * action, confirms the per-teacher summary dialog, then follows each row's
 * Linked chip to capture the created record ids from the deep links.
 */
async function createCarryoversFromAuditGrid(
  p: Page
): Promise<{ first: CreatedCarryoverRef; second: CreatedCarryoverRef }> {
  const { first, second } = await pickTwoEligibleSessions(p);
  const bulkButton = p.locator(AUDIT_BULK_BUTTON);
  await bulkButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  expect(await bulkButton.isDisabled()).toBe(true);

  await auditRowByInstanceId(p, first.instanceId).getByRole("checkbox").first().click();
  await auditRowByInstanceId(p, second.instanceId).getByRole("checkbox").first().click();
  expect(await bulkButton.isDisabled()).toBe(false);
  await bulkButton.click();

  const dialog = p.getByRole("dialog").filter({ hasText: AUDIT_BULK_DIALOG_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await expectDialogTeacherLine(dialog, first.teacherName, 1);
  await expectDialogTeacherLine(dialog, second.teacherName, 1);
  const totalLine = dialog.getByText(exactText(audit.carryover.dialog.totalSessions(2))).first();
  await totalLine.waitFor({ state: "visible", timeout: devWaitTimeout });
  await dialog.getByRole("button", { name: AUDIT_BULK_CONFIRM }).click();
  await expectToast(p, AUDIT_CREATED_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });

  const firstId = await captureCarryoverIdViaLinkedChip(p, first.instanceId);
  const secondId = await captureCarryoverIdViaLinkedChip(p, second.instanceId);
  return {
    first: { id: firstId, teacherName: first.teacherName },
    second: { id: secondId, teacherName: second.teacherName },
  };
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
async function convertToExpense(p: Page, rowFirst: Locator, rowSecond: Locator): Promise<void> {
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
  await expectRowChip(rowFirst, PAID_CHIP);
  await expectRowChip(rowSecond, PAID_CHIP);
}

/** Opens the row's overflow menu, picks the menu item, and returns the opened dialog. */
async function openRowActionDialog(p: Page, row: Locator, menuItem: RegExp, dialogTitle: RegExp): Promise<Locator> {
  await dismissOpenNotifications(p);
  await row.locator(ROW_ACTIONS_SELECTOR).click();
  await p.getByRole("menuitem", { name: menuItem }).click();
  const dialog = p.getByRole("dialog").filter({ hasText: dialogTitle }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  return dialog;
}

/** Unpays one row through its overflow menu and waits for the Unpaid chip. */
async function unpayRow(p: Page, row: Locator): Promise<void> {
  const dialog = await openRowActionDialog(p, row, UNPAY_MENU_ITEM, UNPAY_TITLE);
  await dialog.getByRole("button", { name: UNPAY_CONFIRM }).click();
  await expectToast(p, UNPAID_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  await expectRowChip(row, UNPAID_CHIP);
}

/** Deletes one (unpaid) row through its overflow menu and confirms the dialog. */
async function deleteRow(p: Page, row: Locator): Promise<void> {
  const dialog = await openRowActionDialog(p, row, DELETE_MENU_ITEM, DELETE_TITLE);
  await dialog.getByRole("button", { name: DELETE_CONFIRM }).click();
  await expectToast(p, DELETED_TOAST);
}

/** Whether the row currently carries the Paid chip. */
async function isRowPaid(row: Locator): Promise<boolean> {
  return (await row.locator(".MuiChip-label").filter({ hasText: PAID_CHIP }).count()) > 0;
}

/** Unpays the records that are still paid, then deletes both; failures log without masking the flow result. */
async function cleanupCarryoverPair(p: Page, lookupFirst: RowLookup, lookupSecond: RowLookup): Promise<void> {
  try {
    await dismissOpenNotifications(p);
    const rowFirst = await lookupFirst(p);
    if (await isRowPaid(rowFirst)) await unpayRow(p, rowFirst);
    const rowSecond = await lookupSecond(p);
    if (await isRowPaid(rowSecond)) await unpayRow(p, rowSecond);
    await deleteRow(p, await lookupFirst(p));
    await deleteRow(p, await lookupSecond(p));
  } catch (cleanupError) {
    testLogger.warn("carryover e2e cleanup failed; records left in place", {
      error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
    });
  }
}

/** Finds the CSV data row whose named column cell equals the given value. */
function findCsvRowByColumn(csvLines: readonly string[], column: CsvColumn, value: string): string[] {
  const columnIndex = CSV_HEADER_COLUMNS.indexOf(column);
  for (const line of csvLines.slice(1)) {
    const cells = parseCsvLine(line);
    if (cells[columnIndex] === value) return cells;
  }
  throw new Error(`CSV export is missing the row with ${column} = ${value}`);
}

/**
 * Triggers the CSV export, saves the download, asserts the fixed filename and
 * header contracts, and returns the parsed lines for row-level assertions.
 */
async function downloadCsvExport(p: Page, fileTag: string): Promise<string[]> {
  await dismissOpenNotifications(p);
  const exportButton = p.locator(EXPORT_CSV_BUTTON);
  await exportButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  const downloadPromise = p.waitForEvent("download", { timeout: devWaitTimeout });
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^carryover-balances-\d{4}-\d{2}-\d{2}\.csv$/);

  mkdirSync(EXPORT_DIR, { recursive: true });
  const exportPath = `${EXPORT_DIR}/carryover-balances-${fileTag}.csv`;
  await download.saveAs(exportPath);

  const csvLines = readFileSync(exportPath, "utf8")
    .split("\r\n")
    .filter(line => line.length > 0);
  expect(csvLines.length).toBeGreaterThan(1);
  expect(parseCsvLine(csvLines[0])).toEqual([...CSV_HEADER_COLUMNS]);
  return csvLines;
}

/**
 * One flow record's CSV expectation: the lookup cell that finds its row, the
 * paid flag to assert, and whichever identifying column the flow controls
 * (teacher name for audit-created records, payable amount for form-created).
 */
interface CsvRowExpectation {
  readonly lookupColumn: CsvColumn;
  readonly lookupValue: string;
  readonly expectedPaid: "true" | "false";
  readonly expectedTeacherName: string | null;
  readonly expectedPayable: number | null;
}

/** Asserts one flow row in the parsed CSV and returns its cells. */
function expectCsvRow(csvLines: readonly string[], check: CsvRowExpectation): string[] {
  const row = findCsvRowByColumn(csvLines, check.lookupColumn, check.lookupValue);
  expect(row[CSV_HEADER_COLUMNS.indexOf("isPaid")]).toBe(check.expectedPaid);
  if (check.expectedTeacherName !== null) {
    expect(row[CSV_HEADER_COLUMNS.indexOf("teacherName")]).toBe(check.expectedTeacherName);
  }
  if (check.expectedPayable !== null) {
    expect(row[CSV_HEADER_COLUMNS.indexOf("payable")]).toBe(`${check.expectedPayable}.00`);
  }
  return row;
}

/**
 * Exports the CSV and asserts the two flow rows. The isPaid column mirrors
 * the grid state at export time (first record unpaid after the unpay, second
 * paid — so its paymentDate is populated).
 */
async function verifyCsvExport(
  p: Page,
  fileTag: string,
  first: CsvRowExpectation,
  second: CsvRowExpectation
): Promise<void> {
  const csvLines = await downloadCsvExport(p, fileTag);
  expectCsvRow(csvLines, first);
  const secondRow = expectCsvRow(csvLines, second);
  expect((secondRow[CSV_HEADER_COLUMNS.indexOf("paymentDate")] ?? "").length).toBeGreaterThan(0);
}

describe.serial("Accounting Carryover E2E", () => {
  beforeAll(async () => {
    // Dev-mode first-visit Turbopack compiles of both route trees can exceed
    // the per-assertion devWaitTimeout. Readiness fetches pre-compile them up
    // front (unauthenticated requests redirect but still compile).
    if (process.env.TEST_SERVER_MODE === "production") return;
    await Promise.all(
      [REPORTS_PATH, CARRYOVER_PATH].map(route =>
        fetch(`${getTestBaseUrl()}${route}`, {
          redirect: "follow",
          signal: AbortSignal.timeout(240_000),
        }).catch(error => {
          testLogger.warn(`route pre-warm failed for ${route} (assertions still apply)`, {
            error: error instanceof Error ? error.message : String(error),
          });
        })
      )
    );
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
   * Primary operator journey — the bulk-create step now starts from the audit
   * grid (Phase 6 integration): the operator selects two audited sessions of
   * two distinct teachers on /accounting/reports, confirms the Carryover
   * Balance per-teacher summary dialog, then follows each row's Linked chip
   * into the created record's deep link. The remaining flow runs on
   * /accounting/carryover: fresh records start Unpaid (the board lists them
   * newest-first), both convert to expenses, one is unpaid, the CSV carries
   * both rows, and cleanup deletes them — deleting session-derived carryovers
   * also restores the linked sessions' audit statuses, so the demo dataset
   * stays stable. The expense-ledger page assertion remains deferred until
   * that surface exists.
   */
  test("operator flow (audit grid entry): select audited sessions, bulk carryover, board to-expense, unpay, CSV, cleanup", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, REPORTS_PATH);
    await p.getByText(AUDIT_PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });

    let created: { first: CreatedCarryoverRef; second: CreatedCarryoverRef } | null = null;
    let onBoard = false;
    try {
      created = await createCarryoversFromAuditGrid(p);
      await gotoAppRoute(p, CARRYOVER_PATH);
      await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
      onBoard = true;

      const createdRefs = created;
      const rowFirst = await waitForCarryoverRow(p, createdRefs.first.id);
      const rowSecond = await waitForCarryoverRow(p, createdRefs.second.id);
      await expectRowChip(rowFirst, UNPAID_CHIP);
      await expectRowChip(rowSecond, UNPAID_CHIP);

      await convertToExpense(p, rowFirst, rowSecond);
      await unpayRow(p, await waitForCarryoverRow(p, createdRefs.first.id));
      await verifyCsvExport(
        p,
        `${RUN_SUFFIX}-audit`,
        {
          lookupColumn: "id",
          lookupValue: createdRefs.first.id,
          expectedPaid: "false",
          expectedTeacherName: createdRefs.first.teacherName,
          expectedPayable: null,
        },
        {
          lookupColumn: "id",
          lookupValue: createdRefs.second.id,
          expectedPaid: "true",
          expectedTeacherName: createdRefs.second.teacherName,
          expectedPayable: null,
        }
      );
    } finally {
      // The board-side cleanup runs only when the flow reached the board.
      if (created !== null && onBoard) {
        const createdRefs = created;
        await cleanupCarryoverPair(
          p,
          pageRef => waitForCarryoverRow(pageRef, createdRefs.first.id),
          pageRef => waitForCarryoverRow(pageRef, createdRefs.second.id)
        );
      }
    }
  }, 600_000);

  /**
   * CRUD-path complement of the audit-grid journey: the page's own Add New
   * form still creates manual adjustments (AC-4.1), so this flow keeps that
   * surface covered end-to-end — two records with per-run tokens, bulk to
   * expense, unpay one, CSV export, then cleanup (paid records must be
   * unpaid before they can be deleted).
   */
  test("operator flow (Add New complement): add two carryovers, bulk to expense, unpay one, CSV export, cleanup", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CARRYOVER_PATH);
    await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });

    let createdFirst = false;
    let createdSecond = false;
    try {
      await createBothCarryovers(p);
      createdFirst = true;
      createdSecond = true;

      await convertToExpense(p, await waitForRow(p, TOKEN_FIRST), await waitForRow(p, TOKEN_SECOND));
      await unpayRow(p, await waitForRow(p, TOKEN_FIRST));
      await verifyCsvExport(
        p,
        RUN_SUFFIX,
        {
          lookupColumn: "studentsText",
          lookupValue: TOKEN_FIRST,
          expectedPaid: "false",
          expectedTeacherName: null,
          expectedPayable: PAYABLE_FIRST,
        },
        {
          lookupColumn: "studentsText",
          lookupValue: TOKEN_SECOND,
          expectedPaid: "true",
          expectedTeacherName: null,
          expectedPayable: PAYABLE_SECOND,
        }
      );
    } finally {
      if (createdFirst && createdSecond) {
        await cleanupCarryoverPair(
          p,
          pageRef => waitForRow(pageRef, TOKEN_FIRST),
          pageRef => waitForRow(pageRef, TOKEN_SECOND)
        );
      }
    }
  }, 600_000);
});
