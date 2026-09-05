import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { BrowserContext, Locator, Page } from "playwright";
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
const audit = T.sessionAudit;
const nav = T.coreNav;
const payroll = T.billingPayroll;

const REPORTS_PATH = "/accounting/reports";
/** Drill-down target for any report row: the class-instance audit page. */
const AUDIT_PATH_PATTERN = /\/classes\/[^/]+\/audit$/;

const RUN_SUFFIX = Date.now().toString(36);
const EXPORT_DIR = "scratch/e2e";
/** Fixed server-side download name — intentionally not date-stamped. */
const CSV_FILENAME = "session-audit-report.csv";

const SNAPSHOT_FILES = [
  "public/static/locale-snapshots/en/dashboard.reports.sessionAudit.json",
  "public/static/locale-snapshots/ar/dashboard.reports.sessionAudit.json",
] as const;

const REPORTS_TITLE = new RegExp(escapeRegExp(audit.title));
const REPORTS_NAV_LINK = new RegExp(escapeRegExp(nav.accountingReports));
const TEACHER_FILTER_LABEL = new RegExp(escapeRegExp(audit.filters.teacher));
const STATUS_FILTER_LABEL = new RegExp(escapeRegExp(audit.filters.status));
const ABSENT_STATUS_LABEL = exactText(audit.status.Absent);
const EXPORT_CSV_BUTTON = exactText(audit.action.exportCsv);
const OVERRIDE_DIALOG_TITLE = new RegExp(escapeRegExp(payroll.override.title));
/** MUI renders `color="error"` (the Absent chip color) via this class. */
const ABSENT_CHIP_CLASS = "MuiChip-colorError";

const STATUS_CHIP_SELECTOR = ".MuiDataGrid-row div[data-field='currentStatus'] .MuiChip-root";
const STATUS_CHIP_LABEL_SELECTOR = ".MuiDataGrid-row div[data-field='currentStatus'] .MuiChip-label";

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

function firstDataRow(p: Page): Locator {
  return p.locator(".MuiDataGrid-row").first();
}

/** Text content of one report cell, addressed by its stable data-field name. */
async function readCellText(row: Locator, field: string): Promise<string> {
  return ((await row.locator(`div[data-field="${field}"]`).first().textContent()) ?? "").trim();
}

/** Selects the Absent status in the status multi-select and closes its menu. */
async function filterByAbsentStatus(p: Page): Promise<void> {
  const trigger = p.getByRole("combobox", { name: STATUS_FILTER_LABEL }).first();
  await trigger.waitFor({ state: "visible", timeout: devWaitTimeout });
  await trigger.click();
  const option = p.getByRole("option", { name: ABSENT_STATUS_LABEL }).first();
  await option.waitFor({ state: "visible", timeout: devWaitTimeout });
  await option.click();
  await p.keyboard.press("Escape");
  await p.getByRole("listbox").first().waitFor({ state: "hidden", timeout: devWaitTimeout });
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
 * Waits until the grid shows a row carrying the Absent status chip and returns
 * that row. The journey needs at least one teacher-absent session in the demo
 * dataset, so a timeout surfaces as an actionable error instead of a bare one.
 */
async function requireAbsentRow(p: Page): Promise<Locator> {
  const chip = p.locator(STATUS_CHIP_LABEL_SELECTOR).filter({ hasText: ABSENT_STATUS_LABEL }).first();
  const found = await chip
    .waitFor({ state: "visible", timeout: devWaitTimeout })
    .then(() => true)
    .catch(() => false);
  if (!found) {
    throw new Error(
      "No Absent session rows are available in the demo dataset — the session-audit journey requires at least one " +
        "teacher-absent (Absent status) session. Produce one in the demo data first, then re-run."
    );
  }
  return chip.locator("xpath=ancestor::div[@role='row'][1]");
}

/** Asserts every visible status chip is the red Absent chip. */
async function expectAllVisibleChipsAbsent(p: Page): Promise<void> {
  const chips = p.locator(STATUS_CHIP_SELECTOR);
  await chips.first().waitFor({ state: "visible", timeout: devWaitTimeout });
  const visibleChips = await chips.all();
  expect(visibleChips.length).toBeGreaterThan(0);
  const chipSnapshots = await Promise.all(
    visibleChips.map(async chip => ({
      className: (await chip.getAttribute("class")) ?? "",
      text: ((await chip.textContent()) ?? "").trim(),
    }))
  );
  for (const chip of chipSnapshots) {
    expect(chip.className).toContain(ABSENT_CHIP_CLASS);
    expect(chip.text).toContain(audit.status.Absent);
  }
}

/** Waits until the filter state has been synced into the shareable URL. */
async function waitForFilterParams(p: Page): Promise<void> {
  await p.waitForURL(
    url => {
      const teacherId = url.searchParams.get("teacherId");
      const statuses = url.searchParams.get("currentStatuses");
      return (teacherId ?? "").length > 0 && (statuses ?? "").includes("Absent");
    },
    { timeout: devWaitTimeout }
  );
}

/** Row drill-down: clicks a navigating cell of the first visible row. */
async function openAuditPageFromFirstRow(p: Page): Promise<void> {
  const row = firstDataRow(p);
  await row.waitFor({ state: "visible", timeout: devWaitTimeout });
  await row.locator("div[data-field='scheduledStartAt']").first().click();
  await p.waitForURL(AUDIT_PATH_PATTERN, { timeout: devWaitTimeout });
}

/**
 * Triggers the CSV export, saves the download, and asserts the file contract:
 * the fixed filename and data rows that honor the active Absent status filter.
 */
async function verifyCsvExport(p: Page): Promise<void> {
  const exportButton = p.getByRole("button", { name: EXPORT_CSV_BUTTON });
  await exportButton.waitFor({ state: "visible", timeout: devWaitTimeout });
  const downloadPromise = p.waitForEvent("download", { timeout: devWaitTimeout });
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(CSV_FILENAME);

  mkdirSync(EXPORT_DIR, { recursive: true });
  const exportPath = `${EXPORT_DIR}/session-audit-report-${RUN_SUFFIX}.csv`;
  await download.saveAs(exportPath);

  const csvLines = readFileSync(exportPath, "utf8")
    .split("\r\n")
    .filter(line => line.length > 0);
  expect(csvLines.length).toBeGreaterThan(1);
  const headerCells = parseCsvLine(csvLines[0]);
  const statusIndex = headerCells.indexOf("currentStatus");
  expect(statusIndex).toBeGreaterThanOrEqual(0);
  for (const line of csvLines.slice(1)) {
    const cells = parseCsvLine(line);
    // The export honors the active status filter on every data row.
    expect(cells[statusIndex]).toBe("Absent");
  }
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

describe.serial("Session Audit Reports E2E", () => {
  test("locale snapshot files exist for both locales (EN + AR)", () => {
    for (const snapshotFile of SNAPSHOT_FILES) {
      expect(existsSync(snapshotFile)).toBe(true);
    }
  });

  test("operator with permission: report page renders and sidebar item is present", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, REPORTS_PATH);

    await p.getByText(REPORTS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
    await firstDataRow(p).waitFor({ state: "visible", timeout: devWaitTimeout });

    const reportsLink = p.getByRole("link", { name: REPORTS_NAV_LINK }).first();
    await reportsLink.waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await reportsLink.count()).toBeGreaterThan(0);
  });

  test("operator flow: Absent + teacher filter, red chips, drill-down, back restores filters, CSV export", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, REPORTS_PATH);

    await p.getByText(REPORTS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
    await firstDataRow(p).waitFor({ state: "visible", timeout: devWaitTimeout });

    // Narrow the report to teacher-absent sessions first, then pin the filter
    // to one teacher so every later assertion is deterministic.
    await filterByAbsentStatus(p);
    const absentRow = await requireAbsentRow(p);
    const teacherName = await readCellText(absentRow, "teacherName");
    expect(teacherName.length).toBeGreaterThan(0);

    await filterByTeacher(p, teacherName);
    await expectAllVisibleChipsAbsent(p);
    await waitForFilterParams(p);

    // Row click drills down into the class-instance audit page.
    await openAuditPageFromFirstRow(p);
    const auditPath = new URL(p.url()).pathname;
    expect(auditPath).toMatch(AUDIT_PATH_PATTERN);

    // Browser back restores the URL-shareable filter state.
    await p.goBack();
    await waitForFilterParams(p);
    await expectAllVisibleChipsAbsent(p);

    await verifyCsvExport(p);
  }, 300_000);

  test("override deep link: opens the dialog for payroll-manage holders, consumes the param, stays closed otherwise", async () => {
    const p = await loginAtRoute(DEMO_USERS.academyAdmin.groupSlug, REPORTS_PATH);

    await p.getByText(REPORTS_TITLE).first().waitFor({ state: "visible", timeout: devWaitTimeout });
    await firstDataRow(p).waitFor({ state: "visible", timeout: devWaitTimeout });

    // Land on the audit page without the deep-link flag: dialog stays closed.
    await openAuditPageFromFirstRow(p);
    const auditPath = new URL(p.url()).pathname;
    await gotoAppRoute(p, auditPath);
    await p.locator("main").first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await p.getByRole("dialog").count()).toBe(0);

    // The deep link auto-opens the override dialog for manage holders...
    await gotoAppRoute(p, `${auditPath}?openOverride=1`);
    const dialog = p.getByRole("dialog").filter({ hasText: OVERRIDE_DIALOG_TITLE }).first();
    await dialog.waitFor({ state: "visible", timeout: devWaitTimeout });

    // ...and the flag is single-shot: it is stripped from the URL, so a plain
    // reload of the same address never re-opens the dialog.
    expect(p.url().includes("openOverride")).toBe(false);
    await p.reload();
    await p.locator("main").first().waitFor({ state: "visible", timeout: devWaitTimeout });
    expect(await p.getByRole("dialog").count()).toBe(0);
  }, 300_000);
});
