import { BillingRepository } from "@/backend/db/repo/billing";
import { BillingHistoryService } from "@/backend/services/billing/billing-history.service";
import { StudentManagementService } from "@/backend/services/student/student-management.service";
import { UserService } from "@/backend/services/users/user.service";
import type { BillingFxDisplayContext, DBTransaction, DisplayAmountReturnType } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseCurrencyCode } from "@/shared/lib/enum";

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

function resolveEffectiveDisplayCurrency(
  ctx: BillingFxDisplayContext,
  subjectUserId?: string | null
): CurrencyCode | null {
  if (ctx.billingFxDisplayCurrency !== undefined) {
    return ctx.billingFxDisplayCurrency;
  }

  if (subjectUserId && ctx.billingFxDisplayCurrencyByUserId?.has(subjectUserId)) {
    return ctx.billingFxDisplayCurrencyByUserId.get(subjectUserId) ?? null;
  }

  return ctx.user?.displayCurrency ?? null;
}

export async function setBillingFxDisplayCurrencyForSubject(
  ctx: BillingFxDisplayContext,
  subjectUserId: string | null | undefined,
  callerUserId: string
): Promise<void> {
  if (!subjectUserId || subjectUserId === callerUserId) {
    return;
  }

  const user = await UserService.findSafeById(subjectUserId);
  ctx.billingFxDisplayCurrency = user?.displayCurrency ?? null;
}

export async function setBillingFxDisplayCurrencyForInvoiceParent(
  ctx: BillingFxDisplayContext,
  invoiceId: string,
  callerUserId: string
): Promise<void> {
  const invoice = await BillingHistoryService.getInvoiceById(invoiceId);
  if (!invoice?.parentId) {
    return;
  }

  const parentUserId = await StudentManagementService.findParentUserIdByParentId(invoice.parentId);
  await setBillingFxDisplayCurrencyForSubject(ctx, parentUserId, callerUserId);
}

export async function populateBillingFxDisplayCurrencyByUserId(
  ctx: BillingFxDisplayContext,
  userIds: readonly (string | null | undefined)[]
): Promise<void> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) {
    return;
  }

  const map = ctx.billingFxDisplayCurrencyByUserId ?? new Map<string, CurrencyCode | null>();
  const missingIds = uniqueIds.filter(id => !map.has(id));
  if (missingIds.length > 0) {
    const currencies = await UserService.findDisplayCurrenciesByIds(missingIds);
    for (const [id, displayCurrency] of currencies) {
      map.set(id, displayCurrency);
    }
  }

  ctx.billingFxDisplayCurrencyByUserId = map;
}

export async function resolveDisplayAmountFields(
  items: readonly { id: string }[],
  ctx: BillingFxDisplayContext,
  amountKey: string,
  currencyKey: string,
  subjectUserIdKey?: string | null
): Promise<Map<string, DisplayAmountReturnType | null>> {
  const map = new Map<string, DisplayAmountReturnType | null>();
  await Promise.all(
    items.map(async item => {
      const itemId = item.id;
      const record = item as Record<string, unknown>;
      let subjectUserId: string | null = null;
      if (subjectUserIdKey) {
        const rawValue = record[subjectUserIdKey];
        subjectUserId = typeof rawValue === "string" ? rawValue : null;
      }
      const displayCurrency = resolveEffectiveDisplayCurrency(ctx, subjectUserId);
      if (!displayCurrency) {
        map.set(itemId, null);
        return;
      }

      const amount = record[amountKey];
      const currencyStr = record[currencyKey];
      if ((typeof amount !== "string" && typeof amount !== "number") || typeof currencyStr !== "string") {
        map.set(itemId, null);
        return;
      }

      const result = await FxDisplayService.convertForDisplay(
        String(amount),
        parseCurrencyCode(currencyStr),
        displayCurrency,
        itemId,
        undefined,
        ctx.locale
      );
      map.set(itemId, result);
    })
  );
  return map;
}
