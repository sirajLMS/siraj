import type { DBTransaction } from "@/backend/types";
import { BillingRepository } from "@/backend/db/repo/billing";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { DisplayAmountReturnType } from "@/backend/types";

function multiplyAmountByRate(amount: string, rate: string): string {
  const numericAmount = Number.parseFloat(amount);
  const numericRate = Number.parseFloat(rate);
  if (!Number.isFinite(numericAmount) || !Number.isFinite(numericRate)) {
    return "0";
  }
  return (numericAmount * numericRate).toFixed(2);
}

function combineRates(firstRate: string, secondRate: string): string {
  const first = Number.parseFloat(firstRate);
  const second = Number.parseFloat(secondRate);
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return "0";
  }
  return (first * second).toFixed(6);
}

async function resolveDisplayExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  tx?: DBTransaction,
  locale?: string
): Promise<{ rate: string | null; stale: boolean }> {
  const direct = await BillingRepository.getLatestExchangeRateForDisplay(fromCurrency, toCurrency, tx, locale);
  if (direct.rate && !direct.stale) {
    return direct;
  }

  if (fromCurrency === CurrencyCode.USD || toCurrency === CurrencyCode.USD) {
    return { rate: null, stale: true };
  }

  const toUsd = await BillingRepository.getLatestExchangeRateForDisplay(fromCurrency, CurrencyCode.USD, tx, locale);
  const fromUsd = await BillingRepository.getLatestExchangeRateForDisplay(CurrencyCode.USD, toCurrency, tx, locale);
  if (!toUsd.rate || toUsd.stale || !fromUsd.rate || fromUsd.stale) {
    return { rate: null, stale: true };
  }

  return { rate: combineRates(toUsd.rate, fromUsd.rate), stale: false };
}

export namespace FxDisplayService {
  export async function convertForDisplay(
    lockedAmount: string | null | undefined,
    lockedCurrency: CurrencyCode | null | undefined,
    displayCurrency: CurrencyCode | null | undefined,
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<DisplayAmountReturnType | null> {
    if (!lockedAmount || !lockedCurrency || !displayCurrency) {
      return null;
    }

    const id = `displayAmount:${entityId}:${displayCurrency}`;

    if (lockedCurrency === displayCurrency) {
      return {
        id,
        amount: lockedAmount,
        currency: displayCurrency,
        stale: false,
      };
    }

    const exchange = await resolveDisplayExchangeRate(lockedCurrency, displayCurrency, tx, locale);
    if (!exchange.rate || exchange.stale) {
      return {
        id,
        amount: null,
        currency: displayCurrency,
        stale: true,
      };
    }

    return {
      id,
      amount: multiplyAmountByRate(lockedAmount, exchange.rate),
      currency: displayCurrency,
      stale: false,
    };
  }
}
