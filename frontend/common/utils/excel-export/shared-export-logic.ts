import type { CellStyle, WorkSheet } from "xlsx-js-style";

const EXPORT_FONT = "Cairo";

const titleStyle: CellStyle = {
  font: { name: EXPORT_FONT, bold: true, sz: 16, color: { rgb: "1A237E" } },
  alignment: { horizontal: "center", vertical: "center" },
  fill: { fgColor: { rgb: "E8EAF6" } },
  border: {
    bottom: { style: "medium", color: { rgb: "1A237E" } },
  },
};

const headerStyle: CellStyle = {
  font: { name: EXPORT_FONT, bold: true, sz: 11, color: { rgb: "FFFFFF" } },
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
  font: { name: EXPORT_FONT, sz: 10 },
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
  font: { name: EXPORT_FONT, sz: 10, bold: true },
};

const nameAltStyle: CellStyle = {
  ...nameStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

const statusStyle: CellStyle = {
  ...bodyStyle,
  font: { name: EXPORT_FONT, sz: 10, bold: true },
};

const statusAltStyle: CellStyle = {
  ...statusStyle,
  fill: { fgColor: { rgb: "F5F5FA" } },
};

export type XLSXModule = typeof import("xlsx-js-style");

export function writeMergedTitleCell(XLSX: XLSXModule, ws: WorkSheet, pageTitle: string, totalCols: number): void {
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];
  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleCell] = { v: pageTitle, t: "s", s: titleStyle };
}

export function writeMergedBlankRow(ws: WorkSheet, row: number, totalCols: number): void {
  ws["!merges"]?.push({ s: { r: row, c: 0 }, e: { r: row, c: totalCols - 1 } });
}

export function writeHeaderRow(XLSX: XLSXModule, ws: WorkSheet, headers: readonly string[], headerRow: number): void {
  headers.forEach((header, col) => {
    const cell = XLSX.utils.encode_cell({ r: headerRow, c: col });
    ws[cell] = { v: header, t: "s", s: headerStyle };
  });
}

export interface CellStyleSpec {
  readonly nameColumnIndex: number;
  readonly statusColumnIndex: number;
}

function getCellStyle(col: number, isAlt: boolean, spec: CellStyleSpec): CellStyle {
  if (col === spec.nameColumnIndex) return isAlt ? nameAltStyle : nameStyle;
  if (col === spec.statusColumnIndex) return isAlt ? statusAltStyle : statusStyle;
  return isAlt ? bodyAltStyle : bodyStyle;
}

export function writeDataRow(
  XLSX: XLSXModule,
  ws: WorkSheet,
  row: number,
  idx: number,
  values: readonly (string | number)[],
  spec: CellStyleSpec
): void {
  const isAlt = idx % 2 === 1;
  values.forEach((val, col) => {
    writeCell(XLSX, ws, row, col, val, getCellStyle(col, isAlt, spec));
  });
}

function writeCell(
  XLSX: XLSXModule,
  ws: WorkSheet,
  row: number,
  col: number,
  value: string | number,
  style: CellStyle
): void {
  const cell = XLSX.utils.encode_cell({ r: row, c: col });
  ws[cell] = { v: value, t: typeof value === "number" ? "n" : "s", s: style };
}

export function resolveStatusValue(status: string | null | undefined, statusLabels: Record<string, string>): string {
  if (status === null || status === undefined) return "";
  return statusLabels[status] ?? status;
}
