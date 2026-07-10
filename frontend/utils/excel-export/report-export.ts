import type { ReportLedgerRow, ReportsSummary } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import {
  aggregatePaidAmountTotals,
  formatReportPaidAmounts,
} from "@/frontend/views/dashboard/reports/utils/formatReportPaidAmounts";

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

interface ReportExportData {
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly labels: ReportExportLabels;
  readonly fromDate: string;
  readonly toDate: string;
  readonly showFinancials: boolean;
  readonly locale: string;
  readonly fxMessages: {
    readonly convertedAmount: (values: {
      lockedAmount: string;
      lockedCurrency: string;
      convertedApprox: string;
      displayCurrency: string;
    }) => string;
    readonly displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  };
}

type CellStyle = import("xlsx-js-style").CellStyle;

const FONT = "Cairo";

const titleStyle: CellStyle = {
  font: { name: FONT, bold: true, sz: 16, color: { rgb: "1A237E" } },
  alignment: { horizontal: "center", vertical: "center" },
  fill: { fgColor: { rgb: "E8EAF6" } },
  border: {
    bottom: { style: "medium", color: { rgb: "1A237E" } },
  },
};

const subtitleStyle: CellStyle = {
  font: { name: FONT, sz: 11, color: { rgb: "616161" } },
  alignment: { horizontal: "center" },
};

const headerStyle: CellStyle = {
  font: { name: FONT, bold: true, sz: 11, color: { rgb: "FFFFFF" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  fill: { fgColor: { rgb: "1A237E" } },
  border: {
    bottom: { style: "medium", color: { rgb: "0D1642" } },
    top: { style: "medium", color: { rgb: "0D1642" } },
    left: { style: "thin", color: { rgb: "3949AB" } },
    right: { style: "thin", color: { rgb: "3949AB" } },
  },
};

const bodyStyle: CellStyle = {
  font: { name: FONT, sz: 10 },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    bottom: { style: "thin", color: { rgb: "E0E0E0" } },
    top: { style: "thin", color: { rgb: "E0E0E0" } },
    left: { style: "thin", color: { rgb: "E0E0E0" } },
    right: { style: "thin", color: { rgb: "E0E0E0" } },
  },
};

const bodyAltStyle: CellStyle = {
  ...bodyStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

const totalsStyle: CellStyle = {
  font: { name: FONT, bold: true, sz: 11, color: { rgb: "1A237E" } },
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
  font: { name: FONT, sz: 10, color: { rgb: "2E7D32" } },
  numFmt: "#,##0.00",
};

const financialAltStyle: CellStyle = {
  ...financialStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

const nameStyle: CellStyle = {
  ...bodyStyle,
  alignment: { horizontal: "left" },
  font: { name: FONT, sz: 10, bold: true },
};

const nameAltStyle: CellStyle = {
  ...nameStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

function getBodyStyles(rowIndex: number, isFinancial: boolean): CellStyle {
  const isAlt = rowIndex % 2 === 1;
  if (isFinancial) return isAlt ? financialAltStyle : financialStyle;
  return isAlt ? bodyAltStyle : bodyStyle;
}

type XLSXModule = typeof import("xlsx-js-style");

export async function exportAttendanceReport(data: ReportExportData): Promise<void> {
  const XLSX = await import("xlsx-js-style");

  const { rows, summary, labels, fromDate, toDate, showFinancials, locale, fxMessages } = data;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[]]);

  const headers = buildHeaders(labels, showFinancials);
  const financialColStart = 6;
  const totalCols = headers.length;

  writeTitleAndSubtitle(XLSX, ws, labels.pageTitle, fromDate, toDate, totalCols);
  writeHeaderRow(XLSX, ws, headers);
  writeDataRows(XLSX, ws, rows, showFinancials, financialColStart, locale, fxMessages);
  writeTotalsRow(XLSX, ws, rows, summary, labels.totalsLabel, showFinancials, locale, fxMessages);
  applyColumnWidths(ws, headers, rows, showFinancials);
  applyRowHeights(ws);

  XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

  const filename = `attendance-report-${fromDate}-to-${toDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function buildHeaders(labels: ReportExportLabels, showFinancials: boolean): string[] {
  const headers = [
    labels.tableLabels.name,
    labels.tableLabels.taken,
    labels.tableLabels.absent,
    labels.tableLabels.leave,
    labels.tableLabels.pending,
    labels.tableLabels.hours,
  ];

  if (showFinancials) {
    headers.push(labels.tableLabels.paid);
    headers.push(labels.tableLabels.paidLocked);
  }

  return headers;
}

function writeTitleAndSubtitle(
  XLSX: XLSXModule,
  ws: import("xlsx-js-style").WorkSheet,
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

function writeHeaderRow(XLSX: XLSXModule, ws: import("xlsx-js-style").WorkSheet, headers: readonly string[]): void {
  const headerRow = 3;
  headers.forEach((header, col) => {
    const cell = XLSX.utils.encode_cell({ r: headerRow, c: col });
    ws[cell] = { v: header, t: "s", s: headerStyle };
  });
}

function writeDataRows(
  XLSX: XLSXModule,
  ws: import("xlsx-js-style").WorkSheet,
  rows: readonly ReportLedgerRow[],
  showFinancials: boolean,
  financialColStart: number,
  locale: string,
  fxMessages: ReportExportData["fxMessages"]
): void {
  const dataStartRow = 4;
  rows.forEach((row, idx) => {
    const r = dataStartRow + idx;
    const values = buildRowValues(row, showFinancials, locale, fxMessages);
    writeRowCells(XLSX, ws, r, idx, values, showFinancials, financialColStart);
  });
}

function formatPaidCell(row: ReportLedgerRow, locale: string, fxMessages: ReportExportData["fxMessages"]): string {
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
  locale: string,
  fxMessages: ReportExportData["fxMessages"]
): (string | number)[] {
  const values: (string | number)[] = [row.name, row.taken, row.absent, row.leave, row.pending, row.hours];
  if (showFinancials) {
    values.push(formatPaidCell(row, locale, fxMessages));
    values.push(formatPaidCellLocked(row));
  }
  return values;
}

function writeRowCells(
  XLSX: XLSXModule,
  ws: import("xlsx-js-style").WorkSheet,
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
  ws: import("xlsx-js-style").WorkSheet,
  rows: readonly ReportLedgerRow[],
  summary: ReportsSummary,
  totalsLabel: string,
  showFinancials: boolean,
  locale: string,
  fxMessages: ReportExportData["fxMessages"]
): void {
  const dataStartRow = 4;
  const totalsRow = dataStartRow + rows.length;

  const totalsValues: (string | number)[] = [
    totalsLabel,
    rows.reduce((sum, r) => sum + r.taken, 0),
    rows.reduce((sum, r) => sum + r.absent, 0),
    rows.reduce((sum, r) => sum + r.leave, 0),
    rows.reduce((sum, r) => sum + r.pending, 0),
    summary.totalHours,
  ];

  if (showFinancials) {
    const paidTotals = aggregatePaidAmountTotals(rows);
    totalsValues.push(formatReportPaidAmounts(paidTotals, locale, fxMessages));
    totalsValues.push(
      paidTotals.map(paid => `${paid.amount} ${paid.currency}`).join(" | ") ||
        summary.currencyDistribution.map(slice => `${slice.amount} ${slice.currency}`).join(" | ") ||
        "—"
    );
  }

  totalsValues.forEach((val, col) => {
    const cell = XLSX.utils.encode_cell({ r: totalsRow, c: col });
    ws[cell] = {
      v: val,
      t: typeof val === "number" ? "n" : "s",
      s: totalsStyle,
    };
  });
}

function applyColumnWidths(
  ws: import("xlsx-js-style").WorkSheet,
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

function applyRowHeights(ws: import("xlsx-js-style").WorkSheet): void {
  ws["!rows"] = [{ hpt: 30 }, { hpt: 20 }, {}, { hpt: 22 }];
}
