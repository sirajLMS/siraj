import { type NextRequest, NextResponse } from "next/server";
import { DomainError, ForbiddenError, getServerUserContext, logger, ValidationError } from "@/backend/lib";
import { checkRateLimit, exportRateLimiter } from "@/backend/lib/ratelimit";
import {
  buildProfitLossCsvHeaders,
  isProfitLossExportTruncated,
  PROFIT_LOSS_EXPORT_ROW_LIMIT,
  ProfitLossService,
  parseProfitLossExportInput,
  serializeProfitLossIncomeCsv,
} from "@/backend/services";
import type { ProfitLossLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Income-payments-tab CSV export (GET /api/profit-loss/income/export).
 *
 * Auth: session cookie via `getServerUserContext`; the
 * `ACCOUNTING_PROFITS_VIEW` permission is enforced inside
 * `ProfitLossService.getReport` before any report data is read. Query params:
 * `month` (required, YYYY-MM) and `currency` (required, a supported ISO-4217
 * code). The export reads at most 10 000 rows of the month's income
 * payments; when the full set is larger, the response carries
 * `X-Export-Truncated: true` so the UI can warn that the file is incomplete.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const translations = getServerTranslations(locale);
  const tErrors = translations.errorsTranslations;
  const tLabels: ProfitLossLabels = translations.dashboardTranslations.accountingProfitLoss;

  const { userId } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: tErrors.unauthorized }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`export:${userId}`, exportRateLimiter);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: tErrors.rateLimitExceeded },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((rateLimit.reset - Date.now()) / 1000)).toString(),
        },
      }
    );
  }

  try {
    const input = parseProfitLossExportInput(request.nextUrl.searchParams, tErrors);
    const report = await ProfitLossService.getReport(
      userId,
      input,
      { incomePaymentsLimit: PROFIT_LOSS_EXPORT_ROW_LIMIT },
      tErrors,
      tLabels
    );

    const truncated = isProfitLossExportTruncated(report.incomePaymentsPage.totalCount);
    logger.info("P&L income payments CSV export", {
      actorUserId: userId,
      month: input.month,
      currency: input.currency,
      rowCount: report.incomePaymentsPage.rows.length,
      truncated,
    });

    return new NextResponse(serializeProfitLossIncomeCsv(report.incomePaymentsPage.rows), {
      status: 200,
      headers: buildProfitLossCsvHeaders("income", input.month, truncated),
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: tErrors.insufficientPermissions }, { status: 403 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof DomainError && error.code === "MONTH_INVALID") {
      return NextResponse.json({ error: tLabels.error.monthInvalid }, { status: 400 });
    }
    logger.error("P&L income payments CSV export failed", {
      actorUserId: userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
