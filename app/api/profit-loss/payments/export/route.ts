import { type NextRequest, NextResponse } from "next/server";
import { runProfitLossCsvExport } from "@/app/api/profit-loss/__shared__";
import { logger } from "@/backend/lib";
import {
  buildProfitLossCsvHeaders,
  isProfitLossExportTruncated,
  PROFIT_LOSS_EXPORT_ROW_LIMIT,
  ProfitLossService,
  serializeProfitLossPaymentsCsv,
} from "@/backend/services";

/**
 * Payments-tab CSV export (GET /api/profit-loss/payments/export).
 *
 * Auth: session cookie via `getServerUserContext`; the
 * `ACCOUNTING_PROFITS_VIEW` permission is enforced inside
 * `ProfitLossService.getReport` before any report data is read. Query params:
 * `month` (required, YYYY-MM) and `currency` (required, a supported ISO-4217
 * code). The export reads at most 10 000 rows of the month's payments; when
 * the full set is larger, the response carries `X-Export-Truncated: true` so
 * the UI can warn that the file is incomplete.
 */
export async function GET(request: NextRequest): Promise<Response> {
  return runProfitLossCsvExport(request, "P&L payments CSV export", async ({ userId, input, tErrors, tLabels }) => {
    const report = await ProfitLossService.getReport(
      userId,
      input,
      { paymentsLimit: PROFIT_LOSS_EXPORT_ROW_LIMIT },
      tErrors,
      tLabels
    );

    const truncated = isProfitLossExportTruncated(report.paymentsPage.totalCount);
    logger.info("P&L payments CSV export", {
      actorUserId: userId,
      month: input.month,
      currency: input.currency,
      rowCount: report.paymentsPage.rows.length,
      truncated,
    });

    return new NextResponse(serializeProfitLossPaymentsCsv(report.paymentsPage.rows), {
      status: 200,
      headers: buildProfitLossCsvHeaders("payments", input.month, truncated),
    });
  });
}
