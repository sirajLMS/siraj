import { SupportedCurrencyRepository } from "@/backend/db/repo/billing/currency.repository";
import type { SupportedCurrencyReturnType } from "@/backend/types/billing/currency.types";

export namespace CurrencyCatalogService {
  export async function listSupportedCurrencies(activeOnly = true): Promise<SupportedCurrencyReturnType[]> {
    return activeOnly ? SupportedCurrencyRepository.listActive() : SupportedCurrencyRepository.listAll();
  }

  export async function upsertManyForSeed(
    inputs: Parameters<typeof SupportedCurrencyRepository.upsertMany>[0]
  ): Promise<SupportedCurrencyReturnType[]> {
    return SupportedCurrencyRepository.upsertMany(inputs);
  }
}
