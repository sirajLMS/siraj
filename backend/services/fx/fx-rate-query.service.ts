import { BillingRepository, FxSyncRepository } from "@/backend/db/repo";
import { AppPermission, FxSyncStatus } from "@/backend/enum";
import type { CurrencyCode } from "@/backend/enum/shared/currency.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  CurrencyExchangeRateReturnType,
  ExchangeRateHistoryPaginatedResult,
  FxSyncHealthReturnType,
  PaginationArgs,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const FX_STALE_MS = 24 * 60 * 60 * 1000;

function computeFxSyncIsStale(
  syncRun: {
    readonly finishedAt?: Date | null;
    readonly startedAt?: Date | null;
    readonly status?: string | null;
  } | null
): boolean {
  if (!syncRun) {
    return true;
  }

  const status = (syncRun.status ?? "").toLowerCase();
  if (status === FxSyncStatus.Failed || status === FxSyncStatus.Partial) {
    return true;
  }

  const reference = syncRun.finishedAt ?? syncRun.startedAt;
  if (!reference) {
    return true;
  }

  return Date.now() - reference.getTime() > FX_STALE_MS;
}

export namespace FxRateQueryService {
  async function assertViewPermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_VIEW_EXCHANGE_RATES
    );
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  export async function listLatestExchangeRates(
    actorUserId: string,
    pagination: PaginationArgs | null = null,
    locale?: string
  ): Promise<readonly CurrencyExchangeRateReturnType[]> {
    await assertViewPermission(actorUserId, locale);
    return BillingRepository.listLatestExchangeRates(pagination);
  }

  export async function listExchangeRateHistory(
    actorUserId: string,
    from: CurrencyCode,
    to: CurrencyCode,
    pagination: PaginationArgs | null = null,
    maxDays = 90,
    locale?: string
  ): Promise<ExchangeRateHistoryPaginatedResult> {
    await assertViewPermission(actorUserId, locale);
    return BillingRepository.listExchangeRateHistory(from, to, pagination, maxDays);
  }

  export async function getLatestSyncRun(actorUserId: string, locale?: string) {
    await assertViewPermission(actorUserId, locale);
    return FxSyncRepository.getLatestSyncRun();
  }

  export async function getSyncHealth(): Promise<FxSyncHealthReturnType> {
    const syncRun = await FxSyncRepository.getLatestSyncRun();

    return {
      id: "fx-sync-health",
      isStale: computeFxSyncIsStale(syncRun),
      status: (syncRun?.status as FxSyncStatus | undefined) ?? null,
      finishedAt: syncRun?.finishedAt ?? null,
    };
  }
}
