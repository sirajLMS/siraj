import {
  resolveStatusValue,
  writeDataRow,
  writeHeaderRow,
  writeMergedBlankRow,
  writeMergedTitleCell,
} from "@/frontend/common/utils/excel-export/shared-export-logic";
import type { ParentDirectoryRow } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";

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

const HEADER_ROW = 2;
const DATA_START_ROW = 3;
const NAME_COLUMN = 1;
const STATUS_COLUMN = 4;

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

  writeMergedTitleCell(XLSX, ws, labels.pageTitle, totalCols);
  writeMergedBlankRow(ws, 1, totalCols);
  writeHeaderRow(XLSX, ws, headers, HEADER_ROW);

  rows.forEach((row, idx) => {
    const statusValue = resolveStatusValue(row.lifecycleStatus, labels.table.statusLabels);
    const values: (string | number)[] = [row.index, row.name, row.email, row.time, statusValue, row.unpaidInvoices];
    writeDataRow(XLSX, ws, DATA_START_ROW + idx, idx, values, {
      nameColumnIndex: NAME_COLUMN,
      statusColumnIndex: STATUS_COLUMN,
    });
  });

  ws["!cols"] = [{ wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 16 }];
  ws["!rows"] = [{ hpt: 30 }, {}, { hpt: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, "Parents Directory");

  const date = new Date().toISOString().split("T")[0];
  const filename = `parents-directory-${date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
