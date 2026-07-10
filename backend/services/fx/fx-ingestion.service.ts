import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { BillingRepository, FxSyncRepository } from "@/backend/db/repo";
import { AppPermission, FxSyncStatus, FxSyncTrigger } from "@/backend/enum";
import { CurrencyCode } from "@/backend/enum/shared/currency.enum";
import { getBackendTranslations, logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import { getFxRateProvider } from "@/backend/services/fx/providers/FxRateProviderFactory";
import type * as Types from "@/backend/types";

const IDEMPOTENCY_WINDOW_MINUTES = 30;

export namespace FxIngestionService {
  async function assertRefreshPermission(actorUserId: string | null, locale?: string): Promise<void> {
    if (!actorUserId) return;
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_REFRESH_EXCHANGE_RATES
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }
  }

  async function expandUsdHubRates(hubRates: ReadonlyMap<CurrencyCode, string>): Promise<readonly Types.FxRatePair[]> {
    const pairs: Types.FxRatePair[] = [];
    const codes = Object.values(CurrencyCode);
    for (const target of codes) {
      if (target === CurrencyCode.USD) continue;
      const usdToTarget = hubRates.get(target);
      if (!usdToTarget) {
        logger.warn("Missing USD->X rate from provider; skipping pair", { target });
        continue;
      }
      pairs.push({
        fromCurrency: CurrencyCode.USD,
        toCurrency: target,
        rate: usdToTarget,
        source: "FX_PROVIDER",
      });
      const targetToUsd = invertRate(usdToTarget);
      pairs.push({
        fromCurrency: target,
        toCurrency: CurrencyCode.USD,
        rate: targetToUsd,
        source: "FX_PROVIDER",
      });
    }
    return pairs;
  }

  function invertRate(rate: string): string {
    const numeric = Number.parseFloat(rate);
    if (!Number.isFinite(numeric) || numeric === 0) {
      return "0";
    }
    const inverted = 1 / numeric;
    return formatRate(inverted);
  }

  function formatRate(value: number): string {
    if (!Number.isFinite(value)) return "0";
    return value.toFixed(6);
  }

  export async function refreshRates(
    input: Types.RefreshExchangeRatesInput
  ): Promise<Types.RefreshExchangeRatesResult> {
    const { triggeredByUserId, trigger, force, locale } = input;

    if (trigger === FxSyncTrigger.Manual) {
      await assertRefreshPermission(triggeredByUserId, locale);
    }

    if (!force) {
      const recent = await FxSyncRepository.isRecentSuccess(IDEMPOTENCY_WINDOW_MINUTES);
      if (recent) {
        logger.info("FX sync skipped — recent success within idempotency window", {
          withinMinutes: IDEMPOTENCY_WINDOW_MINUTES,
          trigger,
        });
        return {
          id: "fx-refresh-skipped",
          success: true,
          pairsWritten: 0,
          pairsFailed: 0,
          syncRunId: "",
        };
      }
    }

    const running = await FxSyncRepository.getRunningSyncRun();
    if (running) {
      logger.warn("FX sync already running; rejecting concurrent sync", { runningId: running.id });
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("fxSyncAlreadyRunning"));
    }

    const provider = await getFxRateProvider();
    const syncRun = await FxSyncRepository.createSyncRun({
      provider: provider.name,
      triggerType: trigger,
      triggeredByUserId,
    });

    try {
      const fetchResult = await provider.fetchLatestRates(locale);
      const pairs = await expandUsdHubRates(fetchResult.rates);

      await db.transaction(async (tx: DBTransaction) => {
        for (const pair of pairs) {
          await BillingRepository.updateExchangeRateInTx(
            {
              fromCurrency: pair.fromCurrency,
              toCurrency: pair.toCurrency,
              rate: pair.rate,
              source: pair.source,
              effectiveDate: fetchResult.timestamp,
            },
            triggeredByUserId,
            tx
          );
        }
      });

      const completed = await FxSyncRepository.completeSyncRun(syncRun.id, {
        status: FxSyncStatus.Success,
        pairsWritten: pairs.length,
        pairsFailed: 0,
        providerResponse: fetchResult.rawResponse,
      });

      logger.info("FX sync completed", {
        syncRunId: completed.id,
        pairsWritten: pairs.length,
        provider: provider.name,
        trigger,
      });

      return {
        id: `fx-refresh-${completed.id}`,
        success: true,
        pairsWritten: pairs.length,
        pairsFailed: 0,
        syncRunId: completed.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("FX sync failed; rolling back", { syncRunId: syncRun.id, error: message });

      await FxSyncRepository.completeSyncRun(syncRun.id, {
        status: FxSyncStatus.Failed,
        pairsWritten: 0,
        pairsFailed: 0,
        errorMessage: message,
      });

      return {
        id: `fx-refresh-${syncRun.id}`,
        success: false,
        pairsWritten: 0,
        pairsFailed: 0,
        syncRunId: syncRun.id,
        errorMessage: message,
      };
    }
  }
}
