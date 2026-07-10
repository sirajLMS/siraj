import { BillingRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { UpsertManualExchangeRateInput, UpsertManualExchangeRateResult } from "@/backend/types";

export namespace FxRateAdminService {
  async function assertOverridePermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_OVERRIDE_EXCHANGE_RATES
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }
  }

  export async function upsertManualRate(
    actorUserId: string,
    input: UpsertManualExchangeRateInput,
    locale?: string
  ): Promise<UpsertManualExchangeRateResult> {
    await assertOverridePermission(actorUserId, locale);

    const effectiveDate = input.effectiveDate ? new Date(input.effectiveDate) : new Date();
    const rate = await BillingRepository.updateExchangeRate(
      {
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        rate: input.rate,
        source: "manual",
        effectiveDate,
      },
      actorUserId
    );

    const { providerResponse: _providerResponse, ...rest } = rate;
    void _providerResponse;

    return {
      id: rate.id,
      rate: rest,
    };
  }
}
