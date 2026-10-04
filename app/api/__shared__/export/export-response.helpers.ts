import { EXPORT_ROW_LIMIT } from "@/shared/lib/csv/export-row-limit";

/** RFC-compliant dated CSV filename: `<name>-<YYYY-MM-DD>.csv`. */
export function buildDatedCsvFilename(name: string): string {
  return `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
}

/** Response headers shared by every CSV export route: content type, attachment filename, security headers, truncation flag. */
export function buildCsvResponseHeaders(filename: string, totalCount: number): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("X-Export-Truncated", totalCount > EXPORT_ROW_LIMIT ? "true" : "false");
  return headers;
}
