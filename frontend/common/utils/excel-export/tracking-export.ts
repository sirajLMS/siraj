import {
  resolveStatusValue,
  writeDataRow,
  writeHeaderRow,
  writeMergedTitleCell,
} from "@/frontend/common/utils/excel-export/shared-export-logic";
import type { TrackingRow } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";

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

const HEADER_ROW = 2;
const DATA_START_ROW = 3;
const NAME_COLUMN = 0;
const STATUS_COLUMN = 4;

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

  writeMergedTitleCell(XLSX, ws, labels.pageTitle, totalCols);
  writeHeaderRow(XLSX, ws, headers, HEADER_ROW);

  rows.forEach((row, idx) => {
    const statusValue = resolveStatusValue(row.status, labels.statusLabels);
    const values: string[] = [
      row.teacherName ?? "",
      row.studentName ?? "",
      row.scheduledDate ?? "",
      row.timeSlot ?? "",
      statusValue,
    ];
    writeDataRow(XLSX, ws, DATA_START_ROW + idx, idx, values, {
      nameColumnIndex: NAME_COLUMN,
      statusColumnIndex: STATUS_COLUMN,
    });
  });

  ws["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 16 }];
  ws["!rows"] = [{ hpt: 30 }, {}, { hpt: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, "Reschedule Tracking");

  const date = new Date().toISOString().split("T")[0];
  const filename = `reschedule-tracking-${date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
