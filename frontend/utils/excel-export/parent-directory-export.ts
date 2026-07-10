import type { ParentDirectoryRow } from "@/frontend/views/dashboard/admin/parents/home/directory";

interface ParentDirectoryExportLabels {
  readonly pageTitle: string;
  readonly table: {
    readonly index: string;
    readonly name: string;
    readonly email: string;
    readonly time: string;
    readonly status: string;
    readonly unpaidInvoices: string;
    readonly statusLabels: Record<string, string>;
  };
}

interface ParentDirectoryExportData {
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentDirectoryExportLabels;
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

const nameStyle: CellStyle = {
  ...bodyStyle,
  alignment: { horizontal: "left" },
  font: { name: FONT, sz: 10, bold: true },
};

const nameAltStyle: CellStyle = {
  ...nameStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

const statusStyle: CellStyle = {
  ...bodyStyle,
  font: { name: FONT, sz: 10, bold: true },
};

const statusAltStyle: CellStyle = {
  ...statusStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

export async function exportParentDirectory(data: ParentDirectoryExportData): Promise<void> {
  const XLSX = await import("xlsx-js-style");

  const { rows, labels } = data;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[]]);

  const headers = [
    labels.table.index,
    labels.table.name,
    labels.table.email,
    labels.table.time,
    labels.table.status,
    labels.table.unpaidInvoices,
  ];

  const totalCols = headers.length;

  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleCell] = { v: labels.pageTitle, t: "s", s: titleStyle };

  const blankRow = 1;
  const headerRow = 2;
  ws["!merges"].push({ s: { r: blankRow, c: 0 }, e: { r: blankRow, c: totalCols - 1 } });

  headers.forEach((header, col) => {
    const cell = XLSX.utils.encode_cell({ r: headerRow, c: col });
    ws[cell] = { v: header, t: "s", s: headerStyle };
  });

  const dataStartRow = 3;
  rows.forEach((row, idx) => {
    const r = dataStartRow + idx;
    const isAlt = idx % 2 === 1;

    const values: (string | number)[] = [
      row.index,
      row.name,
      row.email,
      row.time,
      labels.table.statusLabels[row.lifecycleStatus] ?? row.lifecycleStatus,
      row.unpaidInvoices,
    ];

    values.forEach((val, col) => {
      const cell = XLSX.utils.encode_cell({ r, c: col });
      let style: CellStyle;
      if (col === 1) style = isAlt ? nameAltStyle : nameStyle;
      else if (col === 4) style = isAlt ? statusAltStyle : statusStyle;
      else style = isAlt ? bodyAltStyle : bodyStyle;

      ws[cell] = {
        v: val,
        t: typeof val === "number" ? "n" : "s",
        s: style,
      };
    });
  });

  const colWidths = [{ wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 16 }];
  ws["!cols"] = colWidths;

  ws["!rows"] = [{ hpt: 30 }, {}, { hpt: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, "Parents Directory");

  const date = new Date().toISOString().split("T")[0];
  const filename = `parents-directory-${date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
