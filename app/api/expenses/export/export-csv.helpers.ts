import {
  buildCsvResponseHeaders as buildCsvExportResponseHeaders,
  buildDatedCsvFilename,
} from "@/app/api/__shared__/export/export-response.helpers";
import type { ExpenseRow } from "@/backend/types";
import { type CsvColumn, serializeCsvRowset } from "@/shared/lib/csv";

/** One CSV column per expense row field, in the row-contract declaration order. */
const CSV_COLUMNS: readonly CsvColumn<ExpenseRow>[] = [
  { header: "id", pick: row => row.id },
  { header: "teacherId", pick: row => row.teacherId ?? "" },
  { header: "teacherName", pick: row => row.teacherName ?? "" },
  { header: "title", pick: row => row.title },
  { header: "type", pick: row => row.type },
  { header: "expenseValue", pick: row => row.expenseValue },
  { header: "expenseCurrency", pick: row => row.expenseCurrency },
  { header: "paymentDate", pick: row => row.paymentDate },
  { header: "expenseDate", pick: row => row.expenseDate },
  { header: "note", pick: row => row.note ?? "" },
  { header: "sourceEntity", pick: row => row.sourceEntity ?? "" },
  { header: "sourceEntityId", pick: row => row.sourceEntityId ?? "" },
  { header: "createdByUserId", pick: row => row.createdByUserId },
  { header: "createdByName", pick: row => row.createdByName },
  { header: "deletedAt", pick: row => row.deletedAt ?? "" },
  { header: "deletedByUserId", pick: row => row.deletedByUserId ?? "" },
  { header: "deletedReason", pick: row => row.deletedReason ?? "" },
  { header: "createdAt", pick: row => row.createdAt },
  { header: "updatedAt", pick: row => row.updatedAt },
];

/** Serializes expense rows to UTF-8 CSV (header line, one line per row, CRLF separators). */
export function serializeExpenseCsv(rows: readonly ExpenseRow[]): string {
  return serializeCsvRowset(CSV_COLUMNS, rows);
}

export function buildCsvResponseHeaders(totalCount: number): Headers {
  return buildCsvExportResponseHeaders(buildDatedCsvFilename("expenses"), totalCount);
}
