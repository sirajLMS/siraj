import { type NextRequest, NextResponse } from "next/server";
import {
  readExportErrorTranslations,
  readExportLocale,
  resolveExportUserId,
  toExportErrorResponse,
} from "@/app/api/__shared__/export/export-route.helpers";
import {
  buildCsvResponseHeaders,
  parseExportRequest,
} from "@/app/api/accounting/reports/export/export-request.helpers";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { requirePermission, SessionAuditService, serializeSessionAuditCsv } from "@/backend/services";
import { EXPORT_ROW_LIMIT } from "@/shared/lib/csv/export-row-limit";

/**
 * Session audit report CSV export (GET /api/accounting/reports/export).
 *
 * Auth: session cookie via `getServerUserContext` + the
 * `ACCOUNTING_REPORTS_VIEW` permission, both checked before any report data
 * is read. The `includeDeleted` filter additionally requires the
 * `ACCOUNTING_REPORTS_MANAGE` permission and is silently cleared for
 * view-only callers. The export reads at most 10 000 rows of the filtered
 * set; when the full set is larger, the response carries
 * `X-Export-Truncated: true` so the UI can warn that the file is incomplete.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const tErrors = readExportErrorTranslations(readExportLocale(request));
  const userId = await resolveExportUserId(tErrors);
  if (userId instanceof Response) {
    return userId;
  }

  try {
    await requirePermission(userId, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors);

    const { filters, sort } = await parseExportRequest(request.nextUrl.searchParams, userId, tErrors);
    const report = await SessionAuditService.getReport(
      userId,
      filters,
      sort,
      { limit: EXPORT_ROW_LIMIT, offset: 0 },
      tErrors
    );

    logger.info("Session audit CSV export", {
      actorUserId: userId,
      filters,
      sort,
      rowCount: report.rows.length,
      truncated: report.totalCount > EXPORT_ROW_LIMIT,
    });

    return new NextResponse(serializeSessionAuditCsv(report.rows), {
      status: 200,
      headers: buildCsvResponseHeaders(report.totalCount),
    });
  } catch (error) {
    return toExportErrorResponse(error, tErrors, "Session audit CSV export failed");
  }
}
