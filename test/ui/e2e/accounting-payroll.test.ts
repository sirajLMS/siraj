import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { BrowserContext, Locator, Page } from "playwright";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getDefaultTranslations } from "@/shared/locale/server";
import { closeE2eSession, DEMO_USERS, devWaitTimeout, loginAsDemoUserAtRoute } from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const exactText = (s: string): RegExp => new RegExp(`^${escapeRegExp(s)}$`, "i");

const T = getDefaultTranslations().dashboardTranslations;
const payroll = T.billingPayroll;
const nav = T.coreNav;

const PAYROLL_PATH = "/accounting/payroll";

const PAYROLL_TITLE = new RegExp(escapeRegExp(payroll.title));
const PAYROLL_NAV_LINK = new RegExp(escapeRegExp(nav.accountingPayroll));
const TEACHER_FILTER_LABEL = new RegExp(escapeRegExp(payroll.filters.teacher));
const STATUS_FILTER_LABEL = new RegExp(escapeRegExp(payroll.filters.status));
const OVERRIDE_BUTTON = exactText(payroll.override.action);
const EXPORT_CSV_BUTTON = exactText(payroll.exportCsv);
const DIALOG_TITLE = new RegExp(escapeRegExp(payroll.override.title));
const REFUND_TARGET_LABEL = new RegExp(escapeRegExp(payroll.override.target.Refund));
const PARTIAL_TARGET_LABEL = new RegExp(escapeRegExp(payroll.override.target.Partially));
const CALCULATED_TARGET_LABEL = new RegExp(escapeRegExp(payroll.override.target.Calculated));
const PERCENTAGE_LABEL = new RegExp(escapeRegExp(payroll.override.percentage));
const NOTE_LABEL = new RegExp(escapeRegExp(payroll.override.note));
const OVERRIDDEN_TOAST = exactText(payroll.success.overridden);

/** Every calculation-status label, in the filter menu declaration order. */
const ALL_STATUS_LABELS = [
  payroll.status.NOT_CALCULATED,
  payroll.status.CALCULATED,
  payroll.status.PARTIALLY,
  payroll.status.REFUND,
  payroll.status.WAITING_PAID,
  payroll.status.PAID,
] as const;

/** Raw report-row field names the CSV export writes, in column-contract order. */
const CSV_EXPORT_HEADERS = [
  "instanceId",
  "scheduledStartAt",
  "scheduledEndAt",
  "scheduledDurationMinutes",
  "actualStartAt",
  "actualEndAt",
  "calculatedDuration",
  "teacherPaidAmount",
  "teacherPaidCurrency",
  "calculationStatus",
  "isPartialPercentage",
  "payrollNote",
  "teacherId",
  "teacherName",
  "studentId",
  "studentName",
  "subjectId",
  "subjectName",
  "isStudentAbsence",
  "isTeacherAbsence",
] as const;

/** Server-side download filename contract: payroll-report-YYYY-MM-DD.csv */
const CSV_FILENAME_PATTERN = /^payroll-report-\d{4}-\d{2}-\d{2}\.csv$/;
const EXPORT_DIR = "scratch/e2e";

/**
 * Operator-typed override notes (test input data, not rendered translations).
 * Per-run suffixes keep each run audit trail, row lookup, and CSV assertion
 * distinct from earlier runs against the same demo database.
 */
const RUN_SUFFIX = Date.now().toString(36);
const REFUND_NOTE = `E2E payroll refund override ${RUN_SUFFIX}`;
const PARTIAL_NOTE = `E2E payroll partial override ${RUN_SUFFIX}`;
const RESTORE_NOTE = `E2E payroll recalculation restore ${RUN_SUFFIX}`;

let context: BrowserContext | undefined;
let page: Page | undefined;

afterEach(async () => {
  await closeE2eSession(page, context);
  page = undefined;
  context = undefined;
}, 30_000);

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
  await p.screenshot({ path: `scratch/screenshots/payroll-override-failure-${step}.png` }).catch(() => undefined);
  testLogger.error("payroll e2e flow failed", {
    step,
    url: p.url(),
    chips,
    snackbars,
    consoleErrors: pageConsoleErrors.slice(0, 10),
    bodySample: body.slice(0, 500),
  });
}

async function expectToast(p: Page, pattern: RegExp): Promise<void> {
  const toast = p.getByText(pattern).first();
  await toast.waitFor({ state: "visible", timeout: devWaitTimeout });
}

/** Dismiss any open snackbar so the next notification (or click) is not occluded. */
async function dismissOpenNotifications(p: Page): Promise<void> {
  const closeButton = p.locator(".MuiSnackbar-root .MuiIconButton-root:visible").first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}

/** Text content of one report cell, addressed by its stable data-field name. */
async function readCellText(row: Locator, field: string): Promise<string> {
  return ((await row.locator(`div[data-field="${field}"]`).first().textContent()) ?? "").trim();
}

/**
 * Sets the calculation-status multi-select so exactly `wanted` statuses stay
 * selected, regardless of the previous selection. Menu interactions are
 * strictly sequential (one open menu), hence the recursive option walk.
 */
async function applyStatusFilter(p: Page, wanted: readonly string[]): Promise<void> {
  const trigger = p.getByRole("combobox", { name: STATUS_FILTER_LABEL }).first();
  await trigger.waitFor({ state: "visible", timeout: devWaitTimeout });
  await trigger.click();
  await syncStatusOptions(p, [...ALL_STATUS_LABELS], wanted);
  await p.keyboard.press("Escape");
  await p.getByRole("listbox").first().waitFor({ state: "hidden", timeout: devWaitTimeout });
}

/** Reconciles the open status menu with the wanted selection, one option at a time. */
async function syncStatusOptions(p: Page, remaining: readonly string[], wanted: readonly string[]): Promise<void> {
  if (remaining.length === 0) return;
  const [label, ...rest] = remaining;
  const option = p.getByRole("option", { name: exactText(label) }).first();
  await option.waitFor({ state: "visible", timeout: devWaitTimeout });
  const isSelected = (await option.getAttribute("aria-selected")) === "true";
  if (isSelected !== wanted.includes(label)) {
    await option.click();
  }
  await syncStatusOptions(p, rest, wanted);
}

/** Picks one teacher in the filter-bar autocomplete by display name. */
async function filterByTeacher(p: Page, teacherName: string): Promise<void> {
  const input = p.getByLabel(TEACHER_FILTER_LABEL).first();
  await input.waitFor({ state: "visible", timeout: devWaitTimeout });
  await input.click();
  await input.fill(teacherName);
  const option = p.getByRole("option").filter({ hasText: teacherName }).first();
  await option.waitFor({ state: "visible", timeout: devWaitTimeout });
  await option.click();
}

/**
 * Waits until the newest report row carries the CALCULATED status chip and
 * returns that row. When no calculated row surfaces, fails with an
 * actionable diagnostic instead of a bare timeout: the override journey
 * needs at least one calculated snapshot in the demo dataset.
 */
async function requireCalculatedRow(p: Page, preFilterStatuses: readonly string[]): Promise<Locator> {
  const calculatedChip = p
    .locator(".MuiDataGrid-row div[data-field='calculationStatus'] .MuiChip-label")
    .filter({ hasText: exactText(payroll.status.CALCULATED) })
    .first();
  const found = await calculatedChip
    .waitFor({ state: "visible", timeout: devWaitTimeout })
    .then(() => true)
    .catch(() => false);
  if (!found) {
    const emptyVisible = await p
      .getByText(exactText(payroll.empty))
      .first()
      .isVisible()
      .catch(() => false);
    throw new Error(
      "No CALCULATED payroll rows are available in the demo dataset — the override journey requires at least one. " +
        `Statuses visible before filtering: [${preFilterStatuses.join(", ") || "none"}]; ` +
        `empty-state message after filtering: ${String(emptyVisible)}. ` +
        "Produce a calculated snapshot for a terminal session first (for example scripts/payroll-backfill.ts), then re-run."
    );
  }
  return calculatedChip.locator("xpath=ancestor::div[@role='row'][1]");
}

/** Opens the override dialog from a report row and waits for its title. */
async function openOverrideDialog(p: Page, row: Locator): Promise<Locator> {
  await dismissOpenNotifications(p);
  await row.getByRole("button", { name: OVERRIDE_BUTTON }).click();
  const dialog = p.getByRole("dialog").first();
  await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });
  await dialog.getByText(DIALOG_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
  return dialog;
}

/** Selects an override target radio and verifies the underlying input flipped. */
async function selectOverrideTarget(dialog: Locator, label: RegExp, value: string): Promise<void> {
  await dialog.getByRole("radio", { name: label }).click();
  expect(await dialog.locator(`input[type="radio"][value="${value}"]`).isChecked()).toBe(true);
}

/** Fills the operator note (required for refund and partial targets). */
async function fillOverrideNote(dialog: Locator, note: string): Promise<void> {
  const noteField = dialog.getByRole("textbox", { name: NOTE_LABEL });
  await noteField.waitFor({ state: "visible", timeout: devWaitTimeout });
  await noteField.click();
  await noteField.pressSequentially(note);
}

/** Submits the override form and waits for the success toast plus dialog close. */
async function submitOverride(p: Page, dialog: Locator): Promise<void> {
  await dismissOpenNotifications(p);
  await dialog.getByRole("button", { name: OVERRIDE_BUTTON }).click();
  await expectToast(p, OVERRIDDEN_TOAST);
  await dialog.waitFor({ state: "hidden", timeout: devWaitTimeout });
}

/**
 * Applies one override end to end: opens the dialog on `row`, selects the
 * target, fills the operator note (plus the partial percentage when given),
 * submits, and waits for the success toast and dialog close.
 */
async function applyOverride(
  p: Page,
  row: Locator,
  targetLabel: RegExp,
  targetValue: string,
  note: string,
  percentage?: string
): Promise<void> {
  const dialog = await openOverrideDialog(p, row);
  await selectOverrideTarget(dialog, targetLabel, targetValue);
  if (percentage !== undefined) {
    const percentageField = dialog.getByRole("spinbutton", { name: PERCENTAGE_LABEL });
    await percentageField.waitFor({ state: "visible", timeout: devWaitTimeout });
    await percentageField.fill(percentage);
  }
  await fillOverrideNote(dialog, note);
  await submitOverride(p, dialog);
}

/** Waits for the report row carrying `note` and returns it. */
async function rowByNote(p: Page, note: string): Promise<Locator> {
  const row = p.locator(".MuiDataGrid-row").filter({ hasText: note }).first();
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  return row;
}

/**
 * Triggers the CSV export, saves the download, and asserts the file contract:
 * the server-stamped filename, the raw-field-name header row, data rows that
 * honor the active status filter, and the partial-override row itself.
 */
async function verifyCsvExport(p: Page, teacherName: string): Promise<void> {
  const exportButton = p.getByRole("button", { name: EXPORT_CSV_BUTTON });
  await exportButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  const downloadPromise = p.waitForEvent("download", { timeout: devWaitTimeout });
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(CSV_FILENAME_PATTERN);

  mkdirSync(EXPORT_DIR, { recursive: true });
  const exportPath = `${EXPORT_DIR}/payroll-report-${RUN_SUFFIX}.csv`;
  await download.saveAs(exportPath);

  const csvLines = readFileSync(exportPath, "utf8")
    .split("\r\n")
    .filter(line => line.length > 0);
  expect(csvLines.length).toBeGreaterThan(1);
  const headerCells = parseCsvLine(csvLines[0]);
  expect(headerCells).toEqual([...CSV_EXPORT_HEADERS]);

  const dataRows = csvLines.slice(1).map(line => parseCsvLine(line));
  const statusIndex = headerCells.indexOf("calculationStatus");
  for (const cells of dataRows) {
    // The export honors the active status filter on every data row.
    expect(cells[statusIndex]).toBe("PARTIALLY");
  }

  const noteIndex = headerCells.indexOf("payrollNote");
  const partialCells = dataRows.find(cells => cells[noteIndex] === PARTIAL_NOTE);
  if (partialCells === undefined) {
    throw new Error(
      `Exported CSV contains no row carrying the partial-override note "${PARTIAL_NOTE}" (${dataRows.length} data rows).`
    );
  }
  expect(partialCells[statusIndex]).toBe("PARTIALLY");
  expect(partialCells[headerCells.indexOf("isPartialPercentage")]).toBe("50");
  expect(partialCells[headerCells.indexOf("teacherName")]).toBe(teacherName);
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

describe.serial("Accounting Payroll E2E", () => {
  test("snapshot files exist for both locales (EN + AR)", () => {
    // The compile-time snapshots the client translation loader fetches at runtime.
    expect(existsSync("public/static/locale-snapshots/en/dashboard.billing.payroll.json")).toBe(true);
    expect(existsSync("public/static/locale-snapshots/ar/dashboard.billing.payroll.json")).toBe(true);
  });

  test("operator with permission: report renders rows with status chips, sidebar item present", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, PAYROLL_PATH);

    await p.getByText(PAYROLL_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
    const firstRow = p.locator(".MuiDataGrid-row").first();
    await firstRow.waitFor({ state: "visible", timeout: devWaitTimeout });

    // Every report row renders its calculation status as a labeled chip.
    const statusChip = firstRow.locator("div[data-field='calculationStatus'] .MuiChip-label").first();
    await statusChip.waitFor({ state: "visible", timeout: devWaitTimeout });
    const chipText = ((await statusChip.textContent()) ?? "").trim();
    expect(ALL_STATUS_LABELS.includes(chipText)).toBe(true);

    const payrollLink = p.getByRole("link", { name: PAYROLL_NAV_LINK }).first();
    await payrollLink.waitFor({ state: "visible", timeout: devWaitTimeout });
  });

  test("user without permission: redirected away and sidebar item hidden", async () => {
    const p = await loginAtRoute(DEMO_USERS.teacher.groupSlug, PAYROLL_PATH);
    await p.waitForURL(url => !url.pathname.startsWith(PAYROLL_PATH), { timeout: devWaitTimeout });
    expect(new URL(p.url()).pathname.startsWith(PAYROLL_PATH)).toBe(false);

    await p.locator("nav a").first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await p.getByRole("link", { name: PAYROLL_NAV_LINK }).count()).toBe(0);
  });

  test("operator flow: refund override, partial-percentage override, CSV export", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, PAYROLL_PATH);
    let step = "list-render";
    try {
      await p.getByText(PAYROLL_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
      const rows = p.locator(".MuiDataGrid-row");
      await rows.first().waitFor({ state: "visible", timeout: devWaitTimeout });
      const preFilterStatuses = await p
        .locator(".MuiDataGrid-row div[data-field='calculationStatus'] .MuiChip-label")
        .allTextContents();

      // Narrow the report to calculated rows and keep one teacher: the
      // teacher filter bounds every later lookup and the CSV export.
      step = "filter-calculated";
      await applyStatusFilter(p, [payroll.status.CALCULATED]);
      const calculatedRow = await requireCalculatedRow(p, preFilterStatuses);
      const teacherName = await readCellText(calculatedRow, "teacherName");
      expect(teacherName.length).toBeGreaterThan(0);

      step = "filter-teacher";
      await filterByTeacher(p, teacherName);
      const targetRow = await requireCalculatedRow(p, preFilterStatuses);
      expect(await readCellText(targetRow, "calculationStatus")).toBe(payroll.status.CALCULATED);

      // Refund: zeroes the paid amount and requires an operator note.
      step = "refund-override";
      await applyOverride(p, targetRow, REFUND_TARGET_LABEL, "REFUND", REFUND_NOTE);

      step = "refund-verify";
      await applyStatusFilter(p, [payroll.status.REFUND]);
      const refundRow = await rowByNote(p, REFUND_NOTE);
      expect(await readCellText(refundRow, "calculationStatus")).toBe(payroll.status.REFUND);
      expect(await readCellText(refundRow, "teacherPaidAmount")).toContain("0.00");

      // Partially: prorates the calculated amount by an explicit percentage.
      step = "partial-override";
      await applyOverride(p, refundRow, PARTIAL_TARGET_LABEL, "PARTIALLY", PARTIAL_NOTE, "50");

      step = "partial-verify";
      await applyStatusFilter(p, [payroll.status.PARTIALLY]);
      const partialRow = await rowByNote(p, PARTIAL_NOTE);
      expect(await readCellText(partialRow, "calculationStatus")).toBe(payroll.status.PARTIALLY);
      expect(await readCellText(partialRow, "isPartialPercentage")).toBe("50%");

      // The CSV export mirrors the active filters (teacher + PARTIALLY) and
      // uses the raw report field names as headers.
      step = "export-csv";
      await verifyCsvExport(p, teacherName);

      // Restore the row to a plain calculated snapshot so the demo dataset
      // stays reusable: the next run picks the same newest calculated row.
      step = "restore-override";
      await applyOverride(p, partialRow, CALCULATED_TARGET_LABEL, "CALCULATED", RESTORE_NOTE);

      step = "restore-verify";
      await applyStatusFilter(p, [payroll.status.CALCULATED]);
      const restoredRow = await rowByNote(p, RESTORE_NOTE);
      expect(await readCellText(restoredRow, "calculationStatus")).toBe(payroll.status.CALCULATED);
    } catch (error) {
      await dumpFlowDiagnostics(p, step);
      throw error;
    }
  }, 180_000);
});
