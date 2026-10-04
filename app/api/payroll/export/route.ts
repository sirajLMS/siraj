import { type NextRequest, NextResponse } from "next/server";
import {
  readExportErrorTranslations,
  readExportLocale,
  resolveExportUserId,
  toExportErrorResponse,
} from "@/app/api/__shared__/export/export-route.helpers";
import {
  buildCsvResponseHeaders,
  parsePayrollExportFilters,
  serializePayrollReportCsv,
} from "@/app/api/payroll/export/payroll-export.helpers";
import { AppPermission } from "@/backend/enum";
import { PayrollCalculationService, requirePermission } from "@/backend/services";
import { EXPORT_ROW_LIMIT } from "@/shared/lib/csv/export-row-limit";

/**
 * Payroll report CSV export (GET /api/payroll/export).
 *
 * Auth: session cookie via `getServerUserContext` + the
 * `ACCOUNTING_PAYROLL_VIEW` permission, both checked before any payroll data
 * is read. The export reads at most 10 000 rows of the filtered set; when the
 * full set is larger, the response carries `X-Export-Truncated: true` so the
 * UI can warn that the file is incomplete.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const tErrors = readExportErrorTranslations(readExportLocale(request));
  const userId = await resolveExportUserId(tErrors);
  if (userId instanceof Response) {
    return userId;
  }

  try {
    await requirePermission(userId, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors);

    const filters = parsePayrollExportFilters(request.nextUrl.searchParams, tErrors);
    const report = await PayrollCalculationService.getReport(
      userId,
      filters,
      { limit: EXPORT_ROW_LIMIT, offset: 0 },
      tErrors
    );

    return new NextResponse(serializePayrollReportCsv(report.rows), {
      status: 200,
      headers: buildCsvResponseHeaders(report.totalCount),
    });
  } catch (error) {
    return toExportErrorResponse(error, tErrors, "Payroll CSV export failed");
  }
}
