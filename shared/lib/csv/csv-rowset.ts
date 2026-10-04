import { CSV_LINE_SEPARATOR, toCsvCell } from "@/shared/lib/csv/csv-cell";

export interface CsvColumn<Row> {
  readonly header: string;
  readonly pick: (row: Row) => string;
}

/**
 * Serializes rows into an RFC 4180 CSV string via one column contract: a
 * header line, one CRLF-terminated line per row, and a trailing separator
 * after the final line. Nullable fields serialize as empty cells. Pure and
 * synchronous — safe to call on a large pre-fetched row set from request
 * handlers.
 */
export function serializeCsvRowset<Row>(columns: readonly CsvColumn<Row>[], rows: readonly Row[]): string {
  const headerLine = columns.map(column => toCsvCell(column.header)).join(",");
  const dataLines = rows.map(row => columns.map(column => toCsvCell(column.pick(row))).join(","));
  return `${[headerLine, ...dataLines].join(CSV_LINE_SEPARATOR)}${CSV_LINE_SEPARATOR}`;
}
