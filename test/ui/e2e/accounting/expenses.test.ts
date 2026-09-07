import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { BrowserContext, Locator, Page } from "playwright";
import { AppPermission } from "@/backend/enum";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import {
  assignPermissionGroupToUserMutationDocument,
  createPermissionGroupMutationDocument,
  deletePermissionGroupMutationDocument,
  permissionsQueryDocument,
  revokePermissionGroupFromUserMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/permissions/permission-management.documents";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES, ExpenseType } from "@/shared/constants/expenses";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getDefaultTranslations } from "@/shared/locale/server";
import { authenticatedRequest, getTestBaseUrl, loginDemoUser } from "@/test/helpers";
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

const dashboard = getDefaultTranslations().dashboardTranslations;
const expenses = dashboard.accountingExpenses;
const carryover = dashboard.accountingCarryover;
const nav = dashboard.coreNav;
const expenseErrors = getDefaultTranslations().errorsTranslations.expenses;

const EXPENSES_PATH = "/accounting/expenses";
const CARRYOVER_PATH = "/accounting/carryover";
const EXPORT_DIR = "scratch/e2e";

const SNAPSHOT_FILES = [
  "public/static/locale-snapshots/en/dashboard.accounting.expenses.json",
  "public/static/locale-snapshots/ar/dashboard.accounting.expenses.json",
] as const;

// Stable toolbar ids exposed by the expenses grid for test addressing.
const ADD_NEW_BUTTON = "#expenses-add-new";
const BULK_DELETE_BUTTON = "#expenses-bulk-delete";
const EXPORT_CSV_BUTTON = "#expenses-export-csv";
/** Per-row overflow menu trigger (id carries the row id as a suffix). */
const ROW_ACTIONS_SELECTOR = "button[id^='expenses-row-actions-']";
/** Selection checkboxes render only for managers. */
const CHECKBOX_INPUT_SELECTOR = ".MuiDataGrid-checkboxInput";

// Carryover-board anchors reused by the settlement leg of the flow.
const CO_ADD_NEW_BUTTON = "#carryover-add-new";
const CO_BULK_TO_EXPENSE_BUTTON = "#carryover-bulk-to-expense";
const CO_ROW_ACTIONS_SELECTOR = "button[id^='carryover-row-actions-']";

/** Fixed CSV header contract of the export route (row-contract declaration order). */
const CSV_HEADER_COLUMNS = [
  "id",
  "teacherId",
  "teacherName",
  "title",
  "type",
  "expenseValue",
  "expenseCurrency",
  "paymentDate",
  "expenseDate",
  "note",
  "sourceEntity",
  "sourceEntityId",
  "createdByUserId",
  "createdByName",
  "deletedAt",
  "deletedByUserId",
  "deletedReason",
  "createdAt",
  "updatedAt",
] as const;

type CsvColumn = (typeof CSV_HEADER_COLUMNS)[number];

function columnIndex(column: CsvColumn): number {
  return CSV_HEADER_COLUMNS.indexOf(column);
}

const PAGE_TITLE = new RegExp(escapeRegExp(expenses.title));
const NAV_LINK = new RegExp(escapeRegExp(nav.accountingExpenses));
const DELETED_BADGE = exactText(expenses.deletedBadge);

const FORM_TITLE_ADD = new RegExp(escapeRegExp(expenses.modal.form.titleAdd));
const FORM_TITLE_EDIT = new RegExp(escapeRegExp(expenses.modal.form.titleEdit));
const FORM_TITLE_LABEL = new RegExp(escapeRegExp(expenses.modal.form.title));
const FORM_TYPE_LABEL = new RegExp(escapeRegExp(expenses.modal.form.type));
const FORM_VALUE_LABEL = new RegExp(escapeRegExp(expenses.modal.form.value));
const FORM_CURRENCY_LABEL = new RegExp(escapeRegExp(expenses.modal.form.currency));
const FORM_PAYMENT_DATE_LABEL = new RegExp(escapeRegExp(expenses.modal.form.paymentDate));
const FORM_MONTH_LABEL = new RegExp(escapeRegExp(expenses.modal.form.expenseDate));
const FORM_NOTE_LABEL = new RegExp(escapeRegExp(expenses.modal.form.note));
const FORM_SUBMIT = exactText(expenses.modal.form.submit);
const CREATED_TOAST = exactText(expenses.success.created);
const UPDATED_TOAST = exactText(expenses.success.updated);

const EDIT_MENU_ITEM = exactText(expenses.action.edit);
const DELETE_MENU_ITEM = exactText(expenses.action.delete);
const VIEW_SOURCE_MENU_ITEM = exactText(expenses.action.viewSource);
const DELETE_TITLE = new RegExp(escapeRegExp(expenses.modal.delete.title));
const DELETE_CONFIRM = exactText(expenses.modal.delete.confirm);
const DELETE_CANCEL = exactText(expenses.modal.delete.cancel);
const BULK_DELETE_TITLE = (count: number): RegExp => new RegExp(escapeRegExp(expenses.modal.bulkDelete.title(count)));
const BULK_CONFIRM = exactText(expenses.modal.bulkDelete.confirm);
const BULK_CANCEL = exactText(expenses.modal.bulkDelete.cancel);
const BULK_DELETE_BLOCKED_TOAST = exactText(expenseErrors.deleteViaUnpay);
const bulkDeletedToast = (count: number): RegExp => exactText(expenses.success.bulkDeleted(count));
const INCLUDE_DELETED_LABEL = exactText(expenses.filters.includeDeleted);

const SALARIES_TYPE_OPTION = exactText(expenses.type.Salaries);

const CO_PAGE_TITLE = new RegExp(escapeRegExp(carryover.title));
const CO_FORM_TITLE = new RegExp(escapeRegExp(carryover.modal.form.titleAdd));
const CO_FORM_TEACHER_LABEL = new RegExp(escapeRegExp(carryover.modal.form.teacher));
const CO_FORM_CURRENCY_LABEL = new RegExp(escapeRegExp(carryover.modal.form.currency));
const CO_FORM_FROM_LABEL = new RegExp(escapeRegExp(carryover.modal.form.fromDate));
const CO_FORM_TO_LABEL = new RegExp(escapeRegExp(carryover.modal.form.toDate));
const CO_FORM_PAYABLE_LABEL = new RegExp(escapeRegExp(carryover.modal.form.payable));
const CO_FORM_STUDENTS_LABEL = new RegExp(escapeRegExp(carryover.modal.form.studentsText));
const CO_FORM_SUBMIT = exactText(carryover.modal.form.submit);
const CO_CREATED_TOAST = exactText(carryover.success.created);
const CO_BULK_TITLE = new RegExp(escapeRegExp(carryover.modal.bulkToExpense.title));
const CO_BULK_PAYMENT_DATE_LABEL = new RegExp(escapeRegExp(carryover.modal.bulkToExpense.paymentDate));
const CO_BULK_SUBMIT = exactText(carryover.modal.bulkToExpense.submit);
const CO_BULK_TO_EXPENSE_TOAST = exactText(carryover.success.bulkedToExpense(1));
const CO_PAID_CHIP = exactText(carryover.chip.paid);
const CO_UNPAY_BUTTON = exactText(carryover.action.unpay);
const CO_UNPAY_MENU_ITEM = exactText(carryover.action.unpay);
const CO_UNPAY_TITLE = new RegExp(escapeRegExp(carryover.modal.unpay.title));
const CO_UNPAY_CONFIRM = exactText(carryover.modal.unpay.confirm);
const CO_UNPAID_TOAST = exactText(carryover.success.unpaid);
const CO_DELETE_MENU_ITEM = exactText(carryover.action.delete);
const CO_DELETE_TITLE = new RegExp(escapeRegExp(carryover.modal.delete.title));
const CO_DELETE_CONFIRM = exactText(carryover.modal.delete.confirm);
const CO_DELETED_TOAST = exactText(carryover.success.deleted);

/**
 * Test input data (operator-typed record attributes), not rendered
 * translations. Per-run tokens locate the records this suite creates: the two
 * manual expenses by their title, the settlement carryover by studentsText.
 */
const RUN_SUFFIX = Date.now().toString(36);
const RUN_DATE = new Date();
const TOKEN_FIRST = `E2EEX-${RUN_SUFFIX}-A`;
const TOKEN_FIRST_EDITED = `E2EEX-${RUN_SUFFIX}-AE`;
const TOKEN_SECOND = `E2EEX-${RUN_SUFFIX}-B`;
const TOKEN_CARRYOVER = `E2EEX-${RUN_SUFFIX}-C`;
const NOTE_FIRST = `note-${RUN_SUFFIX}-a`;
const VALUE_FIRST = 200 + (Date.now() % 300);
const VALUE_FIRST_EDITED = VALUE_FIRST + 37;
const VALUE_SECOND = VALUE_FIRST + 201;
const PAYABLE_CARRYOVER = 450 + (Date.now() % 200);

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

/** Locates one grid row by its unique per-run token (title / studentsText). */
function rowByToken(p: Page, token: string): Locator {
  return p.locator(".MuiDataGrid-row").filter({ hasText: token }).first();
}

async function waitForRow(p: Page, token: string): Promise<Locator> {
  const row = rowByToken(p, token);
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  return row;
}

/**
 * Locates the settlement expense row: the teacher column carries the selected
 * teacher's snapshot name and the type column carries the Salaries chip (the
 * chip's aria-label holds the localized type caption).
 */
function salariesRowLocator(p: Page, teacherName: string): Locator {
  return p
    .locator(".MuiDataGrid-row")
    .filter({ hasText: teacherName })
    .filter({ has: p.locator(`.MuiChip-root[aria-label="${expenses.type.Salaries}"]`) })
    .first();
}

async function waitForSalariesRow(p: Page, teacherName: string): Promise<Locator> {
  const row = salariesRowLocator(p, teacherName);
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  return row;
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

/** Masked full-date inputs (dd/MM/yyyy in the default ar locale) accept digit-by-digit entry. */
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

/** Masked year-month input (yyyy-MM, the accounting-month picker's format): `yyyymm` digits. */
async function fillMaskedMonth(scope: Page | Locator, p: Page, label: RegExp, date: Date): Promise<void> {
  const field = scope.getByLabel(label).first();
  await field.waitFor({ state: "visible", timeout: devWaitTimeout });
  await field.click();
  const digits = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  await field.pressSequentially(digits);
  await p.keyboard.press("Escape");
  expect((await field.textContent()) ?? "").toContain(String(date.getFullYear()));
}

/** ISO wire formats asserted in the CSV export (date columns serialize as YYYY-MM-DD / YYYY-MM). */
function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isoMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

/** Finds the CSV data row whose named column cell equals the given value. */
function findCsvRowByColumn(csvLines: readonly string[], column: CsvColumn, value: string): string[] {
  for (const line of csvLines.slice(1)) {
    const cells = parseCsvLine(line);
    if ((cells[columnIndex(column)] ?? "") === value) return cells;
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
  expect(download.suggestedFilename()).toMatch(/^expenses-\d{4}-\d{2}-\d{2}\.csv$/);

  mkdirSync(EXPORT_DIR, { recursive: true });
  const exportPath = `${EXPORT_DIR}/expenses-${fileTag}.csv`;
  await download.saveAs(exportPath);

  const csvLines = readFileSync(exportPath, "utf8")
    .split("\r\n")
    .filter(line => line.length > 0);
  expect(csvLines.length).toBeGreaterThan(0);
  expect(parseCsvLine(csvLines[0] ?? "")).toEqual([...CSV_HEADER_COLUMNS]);
  return csvLines;
}

/**
 * Polls until the locator matches no row (or the dev wait deadline passes);
 * absence has no auto-waiting locator state, so the check itself retries.
 */
async function pollRowAbsence(locator: Locator, deadline: number): Promise<boolean> {
  if (Date.now() > deadline) return false;
  if ((await locator.count()) === 0) return true;
  await new Promise(resolve => setTimeout(resolve, 500));
  return pollRowAbsence(locator, deadline);
}

interface ViewOnlyGroupSetup {
  readonly adminToken: string;
  readonly groupId: string;
  readonly groupSlug: string;
  readonly teacherUserId: string;
}

/**
 * Builds the smallest real VIEW-only actor the demo dataset can provide: a
 * run-scoped custom permission group granting exactly ACCOUNTING_EXPENSES_VIEW
 * assigned to the demo teacher (whose seeded roles hold no accounting
 * permissions). demoLogin then resolves the teacher as the group's member, so
 * the browser session is genuinely view-only — VIEW held, MANAGE absent.
 */
async function createViewOnlyExpenseGroup(): Promise<ViewOnlyGroupSetup> {
  const adminToken = await loginDemoUser(DEMO_USERS.academyAdmin.groupSlug);
  const teacherToken = await loginDemoUser(DEMO_USERS.teacher.groupSlug);
  const teacherMe = await authenticatedRequest(teacherToken, "query", meQueryDocument);
  const teacherUserId = teacherMe.me?.id;
  if (typeof teacherUserId !== "string" || teacherUserId === "") {
    throw new Error("demo teacher user id is not resolvable via the me query");
  }
  const permissionsData = await authenticatedRequest(adminToken, "query", permissionsQueryDocument);
  const viewPermission = permissionsData.permissions?.find(
    permission => permission?.key === AppPermission.ACCOUNTING_EXPENSES_VIEW
  );
  if (viewPermission == null || typeof viewPermission.id !== "string") {
    throw new Error("accounting.expenses_view permission row not found in the catalog");
  }
  const created = await authenticatedRequest(adminToken, "mutate", createPermissionGroupMutationDocument, {
    input: {
      name: { en: `E2E Expenses Viewer ${RUN_SUFFIX}` },
      description: { en: "Run-scoped view-only group for the expense ledger E2E" },
      permissionIds: [viewPermission.id],
    },
  });
  const group = created.createPermissionGroup;
  if (group?.id == null || group.slug == null) {
    throw new Error("createPermissionGroup returned an incomplete group");
  }
  await authenticatedRequest(adminToken, "mutate", assignPermissionGroupToUserMutationDocument, {
    input: { groupId: group.id, userId: teacherUserId },
  });
  return { adminToken, groupId: group.id, groupSlug: group.slug, teacherUserId };
}

/** Revokes the teacher membership and deletes the run-scoped group; failures log, never mask. */
async function teardownViewOnlyExpenseGroup(setup: ViewOnlyGroupSetup): Promise<void> {
  try {
    await authenticatedRequest(setup.adminToken, "mutate", revokePermissionGroupFromUserMutationDocument, {
      input: { groupId: setup.groupId, userId: setup.teacherUserId },
    });
    await authenticatedRequest(setup.adminToken, "mutate", deletePermissionGroupMutationDocument, {
      groupId: setup.groupId,
    });
  } catch (teardownError) {
    testLogger.warn("expenses e2e view-only group teardown failed", {
      error: teardownError instanceof Error ? teardownError.message : String(teardownError),
    });
  }
}

const MARKETING_OPTION = exactText(expenses.type.Marketing);
const LOGISTICS_OPTION = exactText(expenses.type.Logistics);

/**
 * State the operator-flow test hands to its cleanup: which rows the flow
 * actually reached, so cleanup never touches records the run never created.
 */
interface FlowState {
  carryoverId: string | null;
  teacherName: string | null;
  firstCreated: boolean;
  secondCreated: boolean;
}

/** Asserts the row carries the status chip with the given label. */
async function expectRowChip(row: Locator, chipPattern: RegExp): Promise<void> {
  const chip = row.locator(".MuiChip-label").filter({ hasText: chipPattern }).first();
  await chip.waitFor({ state: "visible", timeout: devWaitTimeout });
}

/** Checks or unchecks a row's selection checkbox to reach the wanted state. */
async function ensureRowChecked(row: Locator, checked: boolean): Promise<void> {
  const checkbox = row.getByRole("checkbox").first();
  await checkbox.waitFor({ state: "visible", timeout: devWaitTimeout });
  if ((await checkbox.isChecked()) !== checked) {
    await checkbox.click();
  }
}

/** Opens a row's overflow menu, picks the menu item, and returns the opened dialog. */
async function openRowActionDialog(
  p: Page,
  row: Locator,
  actionsSelector: string,
  menuItem: RegExp,
  dialogTitle: RegExp
): Promise<Locator> {
  await dismissOpenNotifications(p);
  await row.locator(actionsSelector).click();
  await p.getByRole("menuitem", { name: menuItem }).click();
  const dialog = p.getByRole("dialog").filter({ hasText: dialogTitle }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  return dialog;
}

/** Picks the teacher (first option) and reads back the resolved display name from the autocomplete input. */
async function pickTeacherAndReadName(dialog: Locator): Promise<string> {
  const input = dialog.getByLabel(CO_FORM_TEACHER_LABEL).first();
  await input.waitFor({ state: "visible", timeout: devWaitTimeout });
  await input.click();
  const option = dialog.page().getByRole("option").first();
  await option.waitFor({ state: "visible", timeout: devWaitTimeout });
  await option.click();
  const name = (await input.inputValue()).trim();
  if (name === "") {
    throw new Error("teacher autocomplete produced an empty selection name");
  }
  return name;
}

/**
 * Creates one carryover balance through the board's Add New form (teacher
 * option 0, currency option 0, today as the period, per-run studentsText
 * token) and returns the teacher snapshot name the settlement expense carries.
 */
async function createCarryoverViaForm(p: Page): Promise<string> {
  await dismissOpenNotifications(p);
  await p.locator(CO_ADD_NEW_BUTTON).click();
  const dialog = p.getByRole("dialog").filter({ hasText: CO_FORM_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  const teacherName = await pickTeacherAndReadName(dialog);
  await pickAutocompleteOption(p, dialog, CO_FORM_CURRENCY_LABEL, 0);
  await fillMaskedDate(dialog, p, CO_FORM_FROM_LABEL, RUN_DATE);
  await fillMaskedDate(dialog, p, CO_FORM_TO_LABEL, RUN_DATE);
  await dialog.getByLabel(CO_FORM_PAYABLE_LABEL).fill(String(PAYABLE_CARRYOVER));
  await dialog.getByLabel(CO_FORM_STUDENTS_LABEL).fill(TOKEN_CARRYOVER);
  await dialog.getByRole("button", { name: CO_FORM_SUBMIT }).click();
  await expectToast(p, CO_CREATED_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  return teacherName;
}

/**
 * Selects the freshly-created carryover row, converts it to an expense via
 * the Bulk To Expense dialog, waits for the Paid chip, and returns the record
 * id (the grid's data-id), which the ledger row keeps as sourceEntityId.
 */
async function settleCarryoverToExpense(p: Page): Promise<string> {
  const row = await waitForRow(p, TOKEN_CARRYOVER);
  const dataId = await row.getAttribute("data-id");
  if (dataId === null || dataId === "") {
    throw new Error("the carryover grid row exposes no data-id for the created record");
  }
  await ensureRowChecked(row, true);
  await dismissOpenNotifications(p);
  await p.locator(CO_BULK_TO_EXPENSE_BUTTON).click();
  const dialog = p.getByRole("dialog").filter({ hasText: CO_BULK_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await fillMaskedDate(dialog, p, CO_BULK_PAYMENT_DATE_LABEL, RUN_DATE);
  await dialog.getByRole("button", { name: CO_BULK_SUBMIT }).click();
  await expectToast(p, CO_BULK_TO_EXPENSE_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  await expectRowChip(row, CO_PAID_CHIP);
  return dataId;
}

interface ManualExpenseInput {
  readonly title: string;
  readonly typeLabel: RegExp;
  readonly value: number;
  readonly note: string;
}

/**
 * Selects the expense type through the type dropdown. The Salaries option is
 * asserted disabled first — create rejects Salaries because the type is
 * written exclusively by the carryover settlement.
 */
async function pickExpenseType(p: Page, dialog: Locator, typeLabel: RegExp): Promise<void> {
  const typeSelect = dialog.getByRole("combobox", { name: FORM_TYPE_LABEL }).first();
  await typeSelect.waitFor({ state: "visible", timeout: devWaitTimeout });
  await typeSelect.click();
  const salariesOption = p.getByRole("option", { name: SALARIES_TYPE_OPTION }).first();
  await salariesOption.waitFor({ state: "visible", timeout: devWaitTimeout });
  expect(await salariesOption.getAttribute("aria-disabled")).toBe("true");
  const typeOption = p.getByRole("option", { name: typeLabel }).first();
  await typeOption.click();
}

/** Fills every Add-mode field the create contract expects; the note stays optional. */
async function fillManualExpenseForm(p: Page, dialog: Locator, input: ManualExpenseInput): Promise<void> {
  await dialog.getByLabel(FORM_TITLE_LABEL).fill(input.title);
  await pickExpenseType(p, dialog, input.typeLabel);
  await dialog.getByLabel(FORM_VALUE_LABEL).fill(String(input.value));
  await pickAutocompleteOption(p, dialog, FORM_CURRENCY_LABEL, 0);
  await fillMaskedDate(dialog, p, FORM_PAYMENT_DATE_LABEL, RUN_DATE);
  await fillMaskedMonth(dialog, p, FORM_MONTH_LABEL, RUN_DATE);
  if (input.note !== "") {
    await dialog.getByLabel(FORM_NOTE_LABEL).fill(input.note);
  }
}

/** Creates one manual expense through the Add New dialog and waits for its row. */
async function createExpenseViaForm(p: Page, input: ManualExpenseInput): Promise<void> {
  await dismissOpenNotifications(p);
  await p.locator(ADD_NEW_BUTTON).click();
  const dialog = p.getByRole("dialog").filter({ hasText: FORM_TITLE_ADD }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await fillManualExpenseForm(p, dialog, input);
  await dialog.getByRole("button", { name: FORM_SUBMIT }).click();
  await expectToast(p, CREATED_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  await waitForRow(p, input.title);
}

/** Edits one row's title and value through the row-menu Edit dialog and waits for the new title's row. */
async function editExpenseViaForm(p: Page, currentTitle: string, next: ManualExpenseInput): Promise<void> {
  const row = await waitForRow(p, currentTitle);
  const dialog = await openRowActionDialog(p, row, ROW_ACTIONS_SELECTOR, EDIT_MENU_ITEM, FORM_TITLE_EDIT);
  await dialog.getByLabel(FORM_TITLE_LABEL).fill(next.title);
  await dialog.getByLabel(FORM_VALUE_LABEL).fill(String(next.value));
  await dialog.getByRole("button", { name: FORM_SUBMIT }).click();
  await expectToast(p, UPDATED_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  await waitForRow(p, next.title);
}

/**
 * Single-row delete of a carryover-backed Salaries expense: the server
 * rejects with EXPENSE_DELETE_VIA_UNPAY, the dialog keeps its in-dialog alert
 * banner, and the destructive confirm stays disabled — the only forward path
 * is the carryover Unpay flow.
 */
async function assertSingleDeleteBlocked(p: Page, salariesRow: Locator): Promise<void> {
  const dialog = await openRowActionDialog(p, salariesRow, ROW_ACTIONS_SELECTOR, DELETE_MENU_ITEM, DELETE_TITLE);
  await dialog.getByRole("button", { name: DELETE_CONFIRM }).click();
  const banner = dialog.getByRole("alert").first();
  await banner.waitFor({ state: "visible", timeout: devWaitTimeout });
  expect((await banner.textContent()) ?? "").toContain(expenseErrors.deleteViaUnpay);
  expect(await dialog.getByRole("button", { name: DELETE_CONFIRM }).isDisabled()).toBe(true);
  await dialog.getByRole("button", { name: DELETE_CANCEL }).click();
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
}

/**
 * Bulk delete containing the protected Salaries row: the batch is atomic
 * server-side, so the whole call rejects with the localized
 * delete-via-unpay message and the dialog stays open (nothing was deleted).
 */
async function assertBulkDeleteBlocked(p: Page, salariesRow: Locator, manualRow: Locator): Promise<void> {
  await ensureRowChecked(salariesRow, true);
  await ensureRowChecked(manualRow, true);
  await dismissOpenNotifications(p);
  await p.locator(BULK_DELETE_BUTTON).click();
  const dialog = p
    .getByRole("dialog")
    .filter({ hasText: BULK_DELETE_TITLE(2) })
    .first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await dialog.getByRole("button", { name: BULK_CONFIRM }).click();
  await expectToast(p, BULK_DELETE_BLOCKED_TOAST);
  expect(await dialog.isVisible()).toBe(true);
  await dialog.getByRole("button", { name: BULK_CANCEL }).click();
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
}

/**
 * Follows the salaries row's View Source action into the carryover detail
 * deep link, asserts the drawer anchored on the RTL (left) edge, and runs
 * the drawer's Unpay flow — the same confirm dialog the board's row menu uses.
 */
async function unpaySalariesViaCarryoverDrawer(p: Page, salariesRow: Locator, carryoverId: string): Promise<void> {
  await dismissOpenNotifications(p);
  await salariesRow.locator(ROW_ACTIONS_SELECTOR).click();
  await p.getByRole("menuitem", { name: VIEW_SOURCE_MENU_ITEM }).click();
  await p.waitForURL(`**/accounting/carryover/${carryoverId}`, { timeout: devWaitTimeout });

  const drawerPaper = p.locator(".MuiDrawer-paper").first();
  await drawerPaper.waitFor({ state: "visible", timeout: devWaitTimeout });
  const drawerBox = await drawerPaper.boundingBox();
  if (drawerBox === null) {
    throw new Error("carryover drawer paper renders no bounding box");
  }
  const viewportWidth = p.viewportSize()?.width ?? null;
  if (viewportWidth !== null) {
    expect(drawerBox.x).toBeLessThan(viewportWidth / 2);
  }

  const unpayButton = p.getByRole("button", { name: CO_UNPAY_BUTTON }).first();
  await unpayButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  await unpayButton.click();
  const dialog = p.getByRole("dialog").filter({ hasText: CO_UNPAY_TITLE }).first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await dialog.getByRole("button", { name: CO_UNPAY_CONFIRM }).click();
  await expectToast(p, CO_UNPAID_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  // The drawer refetches after the unpay; its paid-only Unpay footer disappears.
  expect(await p.getByRole("button", { name: CO_UNPAY_BUTTON }).count()).toBe(0);
}

/**
 * After the settlement reverts, the ledger hides the salaries row by default
 * and surfaces it (struck, with the Deleted badge) once the include-deleted
 * filter is on.
 */
async function assertSalariesRowDeletedAfterUnpay(p: Page, teacherName: string): Promise<void> {
  await gotoAppRoute(p, EXPENSES_PATH);
  await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
  const gone = await pollRowAbsence(salariesRowLocator(p, teacherName), Date.now() + devWaitTimeout);
  if (!gone) {
    throw new Error("the settlement salaries row stayed listed after the carryover unpay");
  }
  const toggleLabel = p.locator("label").filter({ hasText: INCLUDE_DELETED_LABEL }).first();
  await toggleLabel.waitFor({ state: "visible", timeout: devWaitTimeout });
  await toggleLabel.click();
  const row = await waitForSalariesRow(p, teacherName);
  const badge = row.locator(".MuiChip-label").filter({ hasText: DELETED_BADGE }).first();
  await badge.waitFor({ state: "visible", timeout: devWaitTimeout });
}

/**
 * Exports the ledger (include-deleted on, so the reverted salaries row
 * participates) and asserts the two manual rows plus the settlement row
 * against the fixed 19-column contract.
 */
async function verifyFlowCsv(p: Page, carryoverId: string, teacherName: string): Promise<void> {
  const csvLines = await downloadCsvExport(p, `${RUN_SUFFIX}-flow`);
  expect(csvLines.length).toBeGreaterThan(1);

  const firstRow = findCsvRowByColumn(csvLines, "title", TOKEN_FIRST_EDITED);
  expect(firstRow[columnIndex("type")] ?? "").toBe(ExpenseType.MARKETING);
  expect(firstRow[columnIndex("expenseValue")] ?? "").toBe(`${VALUE_FIRST_EDITED}.00`);
  expect(firstRow[columnIndex("note")] ?? "").toBe(NOTE_FIRST);
  expect(firstRow[columnIndex("sourceEntity")] ?? "").toBe("");
  expect(firstRow[columnIndex("deletedAt")] ?? "").toBe("");
  expect(firstRow[columnIndex("paymentDate")] ?? "").toBe(isoDate(RUN_DATE));
  expect(firstRow[columnIndex("expenseDate")] ?? "").toBe(isoMonth(RUN_DATE));

  const secondRow = findCsvRowByColumn(csvLines, "title", TOKEN_SECOND);
  expect(secondRow[columnIndex("type")] ?? "").toBe(ExpenseType.LOGISTICS);
  expect(secondRow[columnIndex("expenseValue")] ?? "").toBe(`${VALUE_SECOND}.00`);
  expect(secondRow[columnIndex("sourceEntity")] ?? "").toBe("");
  expect(secondRow[columnIndex("deletedAt")] ?? "").toBe("");

  const salariesRow = findCsvRowByColumn(csvLines, "sourceEntityId", carryoverId);
  expect(salariesRow[columnIndex("type")] ?? "").toBe(ExpenseType.SALARIES);
  expect(salariesRow[columnIndex("sourceEntity")] ?? "").toBe(EXPENSE_SOURCE_CARRYOVER_BALANCES);
  expect(salariesRow[columnIndex("teacherName")] ?? "").toBe(teacherName);
  expect(salariesRow[columnIndex("paymentDate")] ?? "").toBe(isoDate(RUN_DATE));
  expect((salariesRow[columnIndex("deletedAt")] ?? "").length).toBeGreaterThan(0);
}

/**
 * Deletes the two manual expenses through the toolbar bulk dialog (container
 * rule: a single selected row degrades to the single-row dialog). Tolerant of
 * a partially-failed flow — only rows that still exist are handled.
 */
async function cleanupManualExpenses(p: Page, state: FlowState): Promise<void> {
  if (!state.firstCreated && !state.secondCreated) return;
  await gotoAppRoute(p, EXPENSES_PATH);
  await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
  const rowFirst = rowByToken(p, TOKEN_FIRST_EDITED);
  const rowSecond = rowByToken(p, TOKEN_SECOND);
  const [firstCount, secondCount] = await Promise.all([rowFirst.count(), rowSecond.count()]);
  const hasFirst = state.firstCreated && firstCount > 0;
  const hasSecond = state.secondCreated && secondCount > 0;
  const targetCount = (hasFirst ? 1 : 0) + (hasSecond ? 1 : 0);
  if (targetCount === 0) return;
  await dismissOpenNotifications(p);
  if (hasFirst) await ensureRowChecked(rowFirst, true);
  if (hasSecond) await ensureRowChecked(rowSecond, true);
  await p.locator(BULK_DELETE_BUTTON).click();
  if (targetCount === 1) {
    const singleDialog = p.getByRole("dialog").filter({ hasText: DELETE_TITLE }).first();
    await singleDialog.waitFor({ state: "visible", timeout: devWaitTimeout });
    await singleDialog.getByRole("button", { name: DELETE_CONFIRM }).click();
    await expectToast(p, exactText(expenses.success.deleted));
    return;
  }
  const bulkDialog = p
    .getByRole("dialog")
    .filter({ hasText: BULK_DELETE_TITLE(targetCount) })
    .first();
  await bulkDialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await bulkDialog.getByRole("button", { name: BULK_CONFIRM }).click();
  await expectToast(p, bulkDeletedToast(targetCount));
}

/** Unpays the settlement carryover if it is still paid, then deletes it — keeps the demo dataset stable. */
async function cleanupCarryover(p: Page, state: FlowState): Promise<void> {
  if (state.carryoverId === null) return;
  await gotoAppRoute(p, CARRYOVER_PATH);
  await p.getByText(CO_PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
  const row = p.locator(`.MuiDataGrid-row[data-id="${state.carryoverId}"]`).first();
  if ((await row.count()) === 0) return;
  const paidChips = await row.locator(".MuiChip-label").filter({ hasText: CO_PAID_CHIP }).count();
  if (paidChips > 0) {
    const unpayDialog = await openRowActionDialog(p, row, CO_ROW_ACTIONS_SELECTOR, CO_UNPAY_MENU_ITEM, CO_UNPAY_TITLE);
    await unpayDialog.getByRole("button", { name: CO_UNPAY_CONFIRM }).click();
    await expectToast(p, CO_UNPAID_TOAST);
    await unpayDialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
  }
  const deleteDialog = await openRowActionDialog(p, row, CO_ROW_ACTIONS_SELECTOR, CO_DELETE_MENU_ITEM, CO_DELETE_TITLE);
  await deleteDialog.getByRole("button", { name: CO_DELETE_CONFIRM }).click();
  await expectToast(p, CO_DELETED_TOAST);
}

/** Full-flow cleanup: manual expenses first, then the settlement carryover; failures log without masking the result. */
async function cleanupFlow(p: Page, state: FlowState): Promise<void> {
  try {
    await cleanupManualExpenses(p, state);
    await cleanupCarryover(p, state);
  } catch (cleanupError) {
    testLogger.warn("expenses e2e cleanup failed; records left in place", {
      error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
    });
  }
}

describe.serial("Accounting Expenses E2E", () => {
  beforeAll(async () => {
    // Dev-mode first-visit Turbopack compiles of both route trees can exceed
    // the per-assertion devWaitTimeout. Readiness fetches pre-compile them up
    // front (unauthenticated requests redirect but still compile).
    if (process.env.TEST_SERVER_MODE === "production") return;
    await Promise.all(
      [CARRYOVER_PATH, EXPENSES_PATH].map(route =>
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

  /**
   * Default locale is Arabic, so the document must render RTL: the root dir
   * attribute carries it and the toolbar keeps its logical split (Bulk Delete
   * leading, Export CSV + Add New trailing) without any LTR-only geometry.
   */
  test("operator with permission: page renders with toolbar actions, sidebar item, and RTL direction", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, EXPENSES_PATH);

    await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
    await p.locator(ADD_NEW_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });
    await p.locator(BULK_DELETE_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });
    await p.locator(EXPORT_CSV_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });

    const expensesLink = p.getByRole("link", { name: NAV_LINK }).first();
    await expensesLink.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await expensesLink.count()).toBeGreaterThan(0);

    expect(await p.locator("html").getAttribute("dir")).toBe("rtl");
  });

  /**
   * Denied-role pass: the demo teacher holds no expenses permission, so the
   * page redirects away, the sidebar item disappears, and the CSV route (gated
   * on ACCOUNTING_EXPENSES_VIEW) answers 403 for the session and 401 for an
   * anonymous caller.
   */
  test("user without permission: redirected away, sidebar item hidden, export route denied", async () => {
    const p = await loginAtRoute(DEMO_USERS.teacher.groupSlug, EXPENSES_PATH);
    await p.waitForURL((url: URL) => !url.pathname.startsWith(EXPENSES_PATH), { timeout: devWaitTimeout });
    expect(new URL(p.url()).pathname.startsWith(EXPENSES_PATH)).toBe(false);

    await p.locator("nav a").first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await p.getByRole("link", { name: NAV_LINK }).count()).toBe(0);

    if (context === undefined) throw new Error("browser context was not initialized by loginAtRoute");
    const sessionResponse = await context.request.get("/api/expenses/export");
    expect(sessionResponse.status()).toBe(403);

    const anonymousResponse = await fetch(`${getTestBaseUrl()}/api/expenses/export`);
    expect(anonymousResponse.status).toBe(401);
  });

  /**
   * VIEW-only pass: a session holding ACCOUNTING_EXPENSES_VIEW but not
   * _MANAGE renders the read surface (title, sidebar item, Export CSV) while
   * every manage affordance stays absent — no Add New or Bulk Delete buttons
   * and no selection checkboxes.
   */
  test("view-only role: read surface renders, manage affordances absent, CSV export allowed", async () => {
    const setup = await createViewOnlyExpenseGroup();
    try {
      const p = await loginAtRoute(setup.groupSlug, EXPENSES_PATH);
      await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });

      const expensesLink = p.getByRole("link", { name: NAV_LINK }).first();
      await expensesLink.waitFor({ state: "visible", timeout: devWaitTimeout });

      await p.locator(EXPORT_CSV_BUTTON).waitFor({ state: "visible", timeout: devWaitTimeout });
      expect(await p.locator(ADD_NEW_BUTTON).count()).toBe(0);
      expect(await p.locator(BULK_DELETE_BUTTON).count()).toBe(0);
      expect(await p.locator(CHECKBOX_INPUT_SELECTOR).count()).toBe(0);

      const csvLines = await downloadCsvExport(p, `${RUN_SUFFIX}-view`);
      expect(csvLines.length).toBeGreaterThan(0);
    } finally {
      await teardownViewOnlyExpenseGroup(setup);
    }
  }, 300_000);

  /**
   * Primary operator journey across both surfaces: settle a carryover into a
   * Salaries expense, add two manual expenses, edit one, prove the delete
   * guards (single dialog banner + atomic bulk rejection) around the
   * protected row, revert the settlement via the carryover drawer's Unpay,
   * re-surface the deleted row under the include-deleted filter, and assert
   * the CSV rows — then remove everything it created. A demo-dataset
   * precondition: the teacher autocomplete needs ≥ 1 option and the currency
   * autocomplete ≥ 1 option.
   */
  test("operator flow: settle carryover, create/edit expenses, delete guards, unpay, CSV, cleanup", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, CARRYOVER_PATH);
    await p.getByText(CO_PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });

    const state: FlowState = { carryoverId: null, teacherName: null, firstCreated: false, secondCreated: false };
    try {
      state.teacherName = await createCarryoverViaForm(p);
      state.carryoverId = await settleCarryoverToExpense(p);

      await gotoAppRoute(p, EXPENSES_PATH);
      await p.getByText(PAGE_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });

      await createExpenseViaForm(p, {
        title: TOKEN_FIRST,
        typeLabel: MARKETING_OPTION,
        value: VALUE_FIRST,
        note: NOTE_FIRST,
      });
      state.firstCreated = true;
      await createExpenseViaForm(p, {
        title: TOKEN_SECOND,
        typeLabel: LOGISTICS_OPTION,
        value: VALUE_SECOND,
        note: "",
      });
      state.secondCreated = true;
      await editExpenseViaForm(p, TOKEN_FIRST, {
        title: TOKEN_FIRST_EDITED,
        typeLabel: MARKETING_OPTION,
        value: VALUE_FIRST_EDITED,
        note: NOTE_FIRST,
      });

      const salariesRow = await waitForSalariesRow(p, state.teacherName);
      await assertSingleDeleteBlocked(p, salariesRow);
      await assertBulkDeleteBlocked(p, salariesRow, await waitForRow(p, TOKEN_SECOND));
      await unpaySalariesViaCarryoverDrawer(p, salariesRow, state.carryoverId);
      await assertSalariesRowDeletedAfterUnpay(p, state.teacherName);
      await verifyFlowCsv(p, state.carryoverId, state.teacherName);
    } finally {
      await cleanupFlow(p, state);
    }
  }, 600_000);

  // __ADD_TESTS_BELOW__
});
