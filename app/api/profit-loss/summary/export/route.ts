import { type NextRequest, NextResponse } from "next/server";
import { runProfitLossCsvExport } from "@/app/api/profit-loss/__shared__";
import { logger } from "@/backend/lib";
import { buildProfitLossCsvHeaders, ProfitLossService, serializeProfitLossSummaryCsv } from "@/backend/services";

/**
 * Profits-summary-tab CSV export (GET /api/profit-loss/summary/export).
 *
 * Auth: session cookie via `getServerUserContext`; the
 * `ACCOUNTING_PROFITS_VIEW` permission is enforced inside
 * `ProfitLossService.getReport` before any report data is read. Query params:
 * `month` (required, YYYY-MM) and `currency` (required, a supported ISO-4217
 * code). The summary is a fixed set of aggregate lines over the month's
 * already-capped tab reads, so it is never truncated; the response still
 * carries `X-Export-Truncated: false` so the UI treats all four tabs alike.
 */
export async function GET(request: NextRequest): Promise<Response> {
  return runProfitLossCsvExport(request, "P&L summary CSV export", async ({ userId, input, tErrors, tLabels }) => {
    const report = await ProfitLossService.getReport(userId, input, {}, tErrors, tLabels);

    logger.info("P&L summary CSV export", {
      actorUserId: userId,
      month: input.month,
      currency: input.currency,
    });

    return new NextResponse(serializeProfitLossSummaryCsv(report.profitsSummary, tLabels.aggregate), {
      status: 200,
      headers: buildProfitLossCsvHeaders("summary", input.month, false),
    });
  });
}
