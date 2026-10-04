import { type NextRequest, NextResponse } from "next/server";
import { resolveExportUserId } from "@/app/api/__shared__/export/export-route.helpers";
import { DomainError, ForbiddenError, logger, ValidationError } from "@/backend/lib";
import { parseProfitLossExportInput } from "@/backend/services";
import type { ProfitLossInput } from "@/backend/types";
import type { ErrorsLabels, ProfitLossLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/** Everything one P&L tab export callback needs to read, serialize, and respond for its tab. */
interface ProfitLossCsvExportContext {
  readonly userId: string;
  readonly input: ProfitLossInput;
  readonly tErrors: ErrorsLabels;
  readonly tLabels: ProfitLossLabels;
}

/**
 * Shared request scaffold for the P&L tab CSV exports (GET
 * /api/profit-loss/{expenses,income,payments,summary}/export).
 *
 * Resolves the locale-bound translations, enforces the session-cookie auth
 * gate, applies the shared export rate limit, parses the validated
 * `month`/`currency` input, and maps the shared rejection set (401 / 403 /
 * 429 / 400 / 500). The callback produces the tab-specific CSV response and
 * owns the tab's success-path logging.
 */
export async function runProfitLossCsvExport(
  request: NextRequest,
  logName: string,
  buildResponse: (context: ProfitLossCsvExportContext) => Promise<Response>
): Promise<Response> {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const translations = getServerTranslations(locale);
  const tErrors = translations.errorsTranslations;
  const tLabels: ProfitLossLabels = translations.dashboardTranslations.accountingProfitLoss;

  const userId = await resolveExportUserId(tErrors);
  if (userId instanceof Response) {
    return userId;
  }

  try {
    const input = parseProfitLossExportInput(request.nextUrl.searchParams, tErrors);
    return await buildResponse({ userId, input, tErrors, tLabels });
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
    logger.error(`${logName} failed`, {
      actorUserId: userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
