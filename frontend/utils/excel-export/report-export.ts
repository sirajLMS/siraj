import type { ReportLedgerRow, ReportsSummary } from "@/frontend/views/dashboard/reports/types/reportsTypes";

interface ReportExportLabels {
  readonly pageTitle: string;
  readonly tableLabels: {
    readonly name: string;
    readonly taken: string;
    readonly absent: string;
    readonly leave: string;
    readonly pending: string;
    readonly hours: string;
    readonly paidEgp: string;
    readonly paidUsd: string;
  };
  readonly totalsLabel: string;
  readonly summaryLabels: {
    readonly engagementRate: string;
    readonly financialDistribution: string;
    readonly egpLabel: string;
    readonly usdLabel: string;
  };
}

interface ReportExportData {
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly labels: ReportExportLabels;
  readonly fromDate: string;
  readonly toDate: string;
  readonly showFinancials: boolean;
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

export async function exportAttendanceReport(data: ReportExportData): Promise<void> {
  const XLSX = await import("xlsx-js-style");

  const { rows, summary, labels, fromDate, toDate, showFinancials } = data;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[]]);

  const headers = [
    labels.tableLabels.name,
    labels.tableLabels.taken,
    labels.tableLabels.absent,
    labels.tableLabels.leave,
    labels.tableLabels.pending,
    labels.tableLabels.hours,
  ];

  if (showFinancials) {
    headers.push(labels.tableLabels.paidEgp, labels.tableLabels.paidUsd);
  }

  const financialColStart = 6;
  const totalCols = headers.length;

  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleCell] = { v: labels.pageTitle, t: "s", s: titleStyle };

  const subtitleCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
  ws[subtitleCell] = {
    v: `${fromDate} — ${toDate}`,
    t: "s",
    s: subtitleStyle,
  };
  ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } });

  const headerRow = 3;
  headers.forEach((header, col) => {
    const cell = XLSX.utils.encode_cell({ r: headerRow, c: col });
    ws[cell] = { v: header, t: "s", s: headerStyle };
  });

  const dataStartRow = 4;
  rows.forEach((row, idx) => {
    const r = dataStartRow + idx;
    const values: (string | number)[] = [row.name, row.taken, row.absent, row.leave, row.pending, row.hours];

    if (showFinancials) {
      values.push(row.paidEgp, row.paidUsd);
    }

    values.forEach((val, col) => {
      const cell = XLSX.utils.encode_cell({ r, c: col });
      const isFinancial = showFinancials && col >= financialColStart;
      const isName = col === 0;

      let style: CellStyle;
      if (isName) style = idx % 2 === 1 ? nameAltStyle : nameStyle;
      else style = getBodyStyles(idx, isFinancial);

      ws[cell] = {
        v: typeof val === "number" ? val : (val as string),
        t: typeof val === "number" ? "n" : "s",
        s: style,
      };
    });
  });

  const totalsRow = dataStartRow + rows.length;
  const totalsValues: (string | number)[] = [
    labels.totalsLabel,
    rows.reduce((sum, r) => sum + r.taken, 0),
    rows.reduce((sum, r) => sum + r.absent, 0),
    rows.reduce((sum, r) => sum + r.leave, 0),
    rows.reduce((sum, r) => sum + r.pending, 0),
    summary.totalHours,
  ];

  if (showFinancials) {
    totalsValues.push(summary.totalEgp, summary.totalUsd);
  }

  totalsValues.forEach((val, col) => {
    const cell = XLSX.utils.encode_cell({ r: totalsRow, c: col });
    ws[cell] = {
      v: typeof val === "number" ? val : (val as string),
      t: typeof val === "number" ? "n" : "s",
      s: totalsStyle,
    };
  });

  const colWidths = headers.map((h, i) => {
    if (i === 0) return { wch: 25 };
    const maxDataLen = rows.reduce((max, row) => {
      const vals = [
        row.name,
        row.taken,
        row.absent,
        row.leave,
        row.pending,
        row.hours,
        ...(showFinancials ? [row.paidEgp, row.paidUsd] : []),
      ];
      return Math.max(max, String(vals[i] ?? "").length);
    }, 0);
    return { wch: Math.max(h.length + 4, maxDataLen + 2, 10) };
  });
  ws["!cols"] = colWidths;

  ws["!rows"] = [{ hpt: 30 }, { hpt: 20 }, {}, { hpt: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

  const filename = `attendance-report-${fromDate}-to-${toDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
