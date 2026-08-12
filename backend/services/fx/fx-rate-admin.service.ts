import { BillingRepository } from "@/backend/db/repo/billing";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { UpsertManualExchangeRateInput, UpsertManualExchangeRateResult } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace FxRateAdminService {
  async function assertOverridePermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_OVERRIDE_EXCHANGE_RATES
    );
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
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

    // Discard `providerResponse` from the response — uses the `_`-prefix
    // discard convention honored by `@typescript-eslint/no-unused-vars`.
    const { providerResponse: _providerResponse, ...rest } = rate;

    return {
      id: rate.id,
      rate: rest,
    };
  }
}
