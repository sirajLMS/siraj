import type { TrackingRow } from "@/frontend/views/dashboard/reschedule/tracking/tracking.types";

interface TrackingExportLabels {
  readonly pageTitle: string;
  readonly table: {
    readonly teacher: string;
    readonly student: string;
    readonly scheduledDate: string;
    readonly timeSlot: string;
    readonly status: string;
  };
  readonly statusLabels: Record<string, string>;
}

interface TrackingExportData {
  readonly rows: readonly TrackingRow[];
  readonly labels: TrackingExportLabels;
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

export async function exportRescheduleTracking(data: TrackingExportData): Promise<void> {
  const XLSX = await import("xlsx-js-style");

  const { rows, labels } = data;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[]]);

  const headers = [
    labels.table.teacher,
    labels.table.student,
    labels.table.scheduledDate,
    labels.table.timeSlot,
    labels.table.status,
  ];

  const totalCols = headers.length;

  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleCell] = { v: labels.pageTitle, t: "s", s: titleStyle };

  const headerRow = 2;

  headers.forEach((header, col) => {
    const cell = XLSX.utils.encode_cell({ r: headerRow, c: col });
    ws[cell] = { v: header, t: "s", s: headerStyle };
  });

  const dataStartRow = 3;
  rows.forEach((row, idx) => {
    const r = dataStartRow + idx;
    const isAlt = idx % 2 === 1;

    const statusValue = row.status != null ? (labels.statusLabels[row.status] ?? String(row.status)) : "";
    const values: string[] = [
      row.teacherName ?? "",
      row.studentName ?? "",
      row.scheduledDate ?? "",
      row.timeSlot ?? "",
      statusValue,
    ];

    values.forEach((val, col) => {
      const cell = XLSX.utils.encode_cell({ r, c: col });
      let style: CellStyle;
      if (col === 0) style = isAlt ? nameAltStyle : nameStyle;
      else if (col === 4) style = isAlt ? statusAltStyle : statusStyle;
      else style = isAlt ? bodyAltStyle : bodyStyle;

      ws[cell] = { v: val, t: "s", s: style };
    });
  });

  ws["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 16 }];
  ws["!rows"] = [{ hpt: 30 }, {}, { hpt: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, "Reschedule Tracking");

  const date = new Date().toISOString().split("T")[0];
  const filename = `reschedule-tracking-${date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
