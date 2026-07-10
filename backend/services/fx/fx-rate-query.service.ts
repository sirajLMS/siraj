import { BillingRepository, FxSyncRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import type { CurrencyCode } from "@/backend/enum/shared/currency.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  CurrencyExchangeRateReturnType,
  ExchangeRateHistoryPaginatedResult,
  PaginationArgs,
} from "@/backend/types";

export namespace FxRateQueryService {
  async function assertViewPermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_VIEW_EXCHANGE_RATES
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
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
}
