import { SupportedCurrencyRepository } from "@/backend/db/repo/billing/currency.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { SupportedCurrencyReturnType, SupportedCurrencyUpsertInput } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

export namespace CurrencyCatalogService {
  async function assertManagePermission(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_MANAGE_CURRENCIES);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  export async function listActiveCurrencies(): Promise<SupportedCurrencyReturnType[]> {
    return SupportedCurrencyRepository.listActive();
  }

  export async function listAllCurrencies(): Promise<SupportedCurrencyReturnType[]> {
    return SupportedCurrencyRepository.listAll();
  }

  export async function upsertManyForSeed(
    inputs: Parameters<typeof SupportedCurrencyRepository.upsertMany>[0]
  ): Promise<SupportedCurrencyReturnType[]> {
    return SupportedCurrencyRepository.upsertMany(inputs);
  }

  /**
   * Activate (or re-activate / edit) a supported currency. Always sets
   * `isActive = true`. No in-use guard — activation is always allowed.
   * The `code` is the PK, so re-submitting an existing code updates it.
   */
  export async function activateCurrency(
    actorUserId: string,
    input: SupportedCurrencyUpsertInput,
    tErrors: ErrorsLabels
  ): Promise<SupportedCurrencyReturnType> {
    await assertManagePermission(actorUserId, tErrors);
    const [row] = await SupportedCurrencyRepository.upsertMany([{ ...input, isActive: true }]);
    if (!row) {
      throw new Error(tErrors.invalidInput);
    }
    return row;
  }

  /**
   * Deactivate a supported currency (soft — sets `isActive = false`).
   * Blocked when the currency is referenced by any table that stores
   * currency values (invoices, payments, FX rates, user profiles, etc.).
   */
  export async function deactivateCurrency(
    actorUserId: string,
    code: CurrencyCode,
    tErrors: ErrorsLabels
  ): Promise<boolean> {
    await assertManagePermission(actorUserId, tErrors);
    const inUse = await SupportedCurrencyRepository.isCurrencyInUse(code);
    if (inUse) {
      throw new Error(tErrors.currencyInUse);
    }
    const row = await SupportedCurrencyRepository.deactivateByCode(code);
    return Boolean(row);
  }
}
