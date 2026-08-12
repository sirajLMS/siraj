import type { CellStyle, WorkSheet } from "xlsx-js-style";
import type { FormatCurrencyMessages } from "@/frontend/common/lib/fx-render";
import {
  bodyAltStyle,
  bodyStyle,
  EXPORT_FONT,
  nameAltStyle,
  nameStyle,
  titleStyle,
  writeHeaderRow as writeSharedHeaderRow,
  type XLSXModule,
} from "@/frontend/common/utils/excel-export/shared-export-logic";
import type { ReportLedgerRow, ReportsSummary } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import {
  aggregatePaidAmountTotals,
  formatReportPaidAmounts,
} from "@/frontend/common/views/dashboard/reports/utils/formatReportPaidAmounts";

interface ReportExportLabels {
  readonly pageTitle: string;
  readonly tableLabels: {
    readonly name: string;
    readonly taken: string;
    readonly absent: string;
    readonly leave: string;
    readonly pending: string;
    readonly hours: string;
    readonly paid: string;
    readonly paidLocked: string;
  };
  readonly totalsLabel: string;
  readonly summaryLabels: {
    readonly engagementRate: string;
    readonly financialDistribution: string;
  };
}

interface FinancialsContext {
  readonly locale: string;
  readonly fxMessages: FormatCurrencyMessages;
}

interface ReportExportData {
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly labels: ReportExportLabels;
  readonly fromDate: string;
  readonly toDate: string;
  readonly showFinancials: boolean;
  readonly locale: string;
  readonly fxMessages: FormatCurrencyMessages;
}

const subtitleStyle: CellStyle = {
  font: { name: EXPORT_FONT, sz: 11, color: { rgb: "616161" } },
  alignment: { horizontal: "center" },
};

const totalsStyle: CellStyle = {
  font: { name: EXPORT_FONT, bold: true, sz: 11, color: { rgb: "1A237E" } },
  alignment: { horizontal: "center", vertical: "center" },
  fill: { fgColor: { rgb: "E8EAF6" } },
  border: {
    top: { style: "medium", color: { rgb: "1A237E" } },
    bottom: { style: "medium", color: { rgb: "1A237E" } },
    left: { style: "thin", color: { rgb: "3949AB" } },
    right: { style: "thin", color: { rgb: "3949AB" } },
  },
};

const financialStyle: CellStyle = {
  ...bodyStyle,
  font: { name: EXPORT_FONT, sz: 10, color: { rgb: "2E7D32" } },
  numFmt: "#,##0.00",
};

const financialAltStyle: CellStyle = {
  ...financialStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

function getBodyStyles(rowIndex: number, isFinancial: boolean): CellStyle {
  const isAlt = rowIndex % 2 === 1;
  if (isFinancial) return isAlt ? financialAltStyle : financialStyle;
  return isAlt ? bodyAltStyle : bodyStyle;
}

export async function exportAttendanceReport(data: ReportExportData): Promise<void> {
  const XLSX = await import("xlsx-js-style");

  const { rows, summary, labels, fromDate, toDate, showFinancials, locale, fxMessages } = data;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[]]);

  const headers = buildHeaders(labels, showFinancials);
  const financialColStart = 6;
  const totalCols = headers.length;
  const financialsCtx: FinancialsContext = { locale, fxMessages };

  writeTitleAndSubtitle(XLSX, ws, labels.pageTitle, fromDate, toDate, totalCols);
  writeHeaders(XLSX, ws, headers);
  writeDataRows(XLSX, ws, rows, showFinancials, financialColStart, financialsCtx);
  writeTotalsRow(XLSX, ws, rows, summary, labels.totalsLabel, showFinancials, financialsCtx);
  applyColumnWidths(ws, headers, rows, showFinancials);
  applyRowHeights(ws);

  XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

  const filename = `attendance-report-${fromDate}-to-${toDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function buildHeaders(labels: ReportExportLabels, showFinancials: boolean): string[] {
  const baseHeaders = [
    labels.tableLabels.name,
    labels.tableLabels.taken,
    labels.tableLabels.absent,
    labels.tableLabels.leave,
    labels.tableLabels.pending,
    labels.tableLabels.hours,
  ];

  return showFinancials ? [...baseHeaders, labels.tableLabels.paid, labels.tableLabels.paidLocked] : baseHeaders;
}

function writeTitleAndSubtitle(
  XLSX: XLSXModule,
  ws: WorkSheet,
  pageTitle: string,
  fromDate: string,
  toDate: string,
  totalCols: number
): void {
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleCell] = { v: pageTitle, t: "s", s: titleStyle };

  const subtitleCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
  ws[subtitleCell] = {
    v: `${fromDate} — ${toDate}`,
    t: "s",
    s: subtitleStyle,
  };
  ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } });
}

function writeHeaders(XLSX: XLSXModule, ws: WorkSheet, headers: readonly string[]): void {
  writeSharedHeaderRow(XLSX, ws, headers, 3);
}

function writeDataRows(
  XLSX: XLSXModule,
  ws: WorkSheet,
  rows: readonly ReportLedgerRow[],
  showFinancials: boolean,
  financialColStart: number,
  financialsCtx: FinancialsContext
): void {
  const dataStartRow = 4;
  rows.forEach((row, idx) => {
    const r = dataStartRow + idx;
    const values = buildRowValues(row, showFinancials, financialsCtx);
    writeRowCells(XLSX, ws, r, idx, values, showFinancials, financialColStart);
  });
}

function formatPaidCell(row: ReportLedgerRow, financialsCtx: FinancialsContext): string {
  const { locale, fxMessages } = financialsCtx;
  return (
    formatReportPaidAmounts(row.paidAmounts, locale, fxMessages) ||
    row.paidAmounts.map(paid => `${paid.amount} ${paid.currency}`).join(" | ") ||
    "—"
  );
}

function formatPaidCellLocked(row: ReportLedgerRow): string {
  return row.paidAmounts.map(paid => `${paid.amount} ${paid.currency}`).join(" | ") || "—";
}

function buildRowValues(
  row: ReportLedgerRow,
  showFinancials: boolean,
  financialsCtx: FinancialsContext
): (string | number)[] {
  const baseValues: (string | number)[] = [row.name, row.taken, row.absent, row.leave, row.pending, row.hours];

  return showFinancials ? [...baseValues, formatPaidCell(row, financialsCtx), formatPaidCellLocked(row)] : baseValues;
}

function writeRowCells(
  XLSX: XLSXModule,
  ws: WorkSheet,
  rowIndex: number,
  dataIdx: number,
  values: readonly (string | number)[],
  showFinancials: boolean,
  financialColStart: number
): void {
  values.forEach((val, col) => {
    const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
    const isFinancial = showFinancials && col >= financialColStart;
    const isName = col === 0;

    let style: CellStyle;
    if (isName) style = dataIdx % 2 === 1 ? nameAltStyle : nameStyle;
    else style = getBodyStyles(dataIdx, isFinancial);

    ws[cell] = {
      v: val,
      t: typeof val === "number" ? "n" : "s",
      s: style,
    };
  });
}

function writeTotalsRow(
  XLSX: XLSXModule,
  ws: WorkSheet,
  rows: readonly ReportLedgerRow[],
  summary: ReportsSummary,
  totalsLabel: string,
  showFinancials: boolean,
  financialsCtx: FinancialsContext
): void {
  const dataStartRow = 4;
  const totalsRow = dataStartRow + rows.length;

  const baseTotals: (string | number)[] = [
    totalsLabel,
    rows.reduce((sum, r) => sum + r.taken, 0),
    rows.reduce((sum, r) => sum + r.absent, 0),
    rows.reduce((sum, r) => sum + r.leave, 0),
    rows.reduce((sum, r) => sum + r.pending, 0),
    summary.totalHours,
  ];

  const totalsValues = showFinancials
    ? [...baseTotals, ...buildFinancialTotals(rows, summary, financialsCtx)]
    : baseTotals;

  totalsValues.forEach((val, col) => {
    const cell = XLSX.utils.encode_cell({ r: totalsRow, c: col });
    ws[cell] = {
      v: val,
      t: typeof val === "number" ? "n" : "s",
      s: totalsStyle,
    };
  });
}

function buildFinancialTotals(
  rows: readonly ReportLedgerRow[],
  summary: ReportsSummary,
  financialsCtx: FinancialsContext
): (string | number)[] {
  const { locale, fxMessages } = financialsCtx;
  const paidTotals = aggregatePaidAmountTotals(rows);
  return [
    formatReportPaidAmounts(paidTotals, locale, fxMessages),
    paidTotals.map(paid => `${paid.amount} ${paid.currency}`).join(" | ") ||
      summary.currencyDistribution.map(slice => `${slice.amount} ${slice.currency}`).join(" | ") ||
      "—",
  ];
}

function applyColumnWidths(
  ws: WorkSheet,
  headers: readonly string[],
  rows: readonly ReportLedgerRow[],
  showFinancials: boolean
): void {
  const colWidths = headers.map((h, i) => {
    if (i === 0) return { wch: 25 };
    const maxDataLen = rows.reduce((max, row) => {
      const vals: (string | number)[] = [
        row.name,
        row.taken,
        row.absent,
        row.leave,
        row.pending,
        row.hours,
        ...(showFinancials ? [formatPaidCellLocked(row)] : []),
      ];
      return Math.max(max, String(vals[i] ?? "").length);
    }, 0);
    return { wch: Math.max(h.length + 4, maxDataLen + 2, 10) };
  });
  ws["!cols"] = colWidths;
}

function applyRowHeights(ws: WorkSheet): void {
  ws["!rows"] = [{ hpt: 30 }, { hpt: 20 }, {}, { hpt: 22 }];
}
