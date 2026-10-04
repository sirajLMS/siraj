import { type NextRequest, NextResponse } from "next/server";
import {
  readExportErrorTranslations,
  readExportLocale,
  resolveExportUserId,
  toExportErrorResponse,
} from "@/app/api/__shared__/export/export-route.helpers";
import { buildCsvResponseHeaders, serializeExpenseCsv } from "@/app/api/expenses/export/export-csv.helpers";
import { parseExportFilters } from "@/app/api/expenses/export/export-filters.helpers";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { ExpenseService, requirePermission } from "@/backend/services";
import { EXPORT_ROW_LIMIT } from "@/shared/lib/csv/export-row-limit";

/**
 * Expense ledger CSV export (GET /api/expenses/export).
 *
 * Auth: session cookie via `getServerUserContext` + the
 * `ACCOUNTING_EXPENSES_VIEW` permission, both checked before any expense
 * data is read. The `includeDeleted` filter additionally requires the
 * `ACCOUNTING_EXPENSES_MANAGE` permission and is silently cleared for
 * view-only callers (same contract as the ledger GraphQL query). The export
 * reads at most 10 000 rows of the filtered set; when the full set is
 * larger, the response carries `X-Export-Truncated:
 * true` so the UI can warn that the file is incomplete.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const tErrors = readExportErrorTranslations(readExportLocale(request));
  const userId = await resolveExportUserId(tErrors);
  if (userId instanceof Response) {
    return userId;
  }

  try {
    await requirePermission(userId, AppPermission.ACCOUNTING_EXPENSES_VIEW, tErrors);

    const filters = await parseExportFilters(request.nextUrl.searchParams, userId, tErrors);
    const report = await ExpenseService.getReport(userId, filters, { limit: EXPORT_ROW_LIMIT, offset: 0 }, tErrors);

    logger.info("Expense ledger CSV export", {
      actorUserId: userId,
      filters,
      rowCount: report.rows.length,
      truncated: report.totalCount > EXPORT_ROW_LIMIT,
    });

    return new NextResponse(serializeExpenseCsv(report.rows), {
      status: 200,
      headers: buildCsvResponseHeaders(report.totalCount),
    });
  } catch (error) {
    return toExportErrorResponse(error, tErrors, "Expense ledger CSV export failed");
  }
}
