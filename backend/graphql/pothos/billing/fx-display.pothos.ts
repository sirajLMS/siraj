import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { BillingHistoryService, FxDisplayService, StudentManagementService, UserService } from "@/backend/services";
import type { DisplayAmountReturnType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseCurrencyCode } from "@/shared/lib/enum";

const DisplayAmountRef = gqlSchemaBuilder.objectRef<DisplayAmountReturnType>("DisplayAmount");

export const DisplayAmountPothosObject = DisplayAmountRef.implement({
  fields: t => ({
    id: t.exposeID("id"),
    amount: t.exposeString("amount", { nullable: true }),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    stale: t.boolean({ resolve: parent => parent.stale }),
  }),
});

export function resolveEffectiveDisplayCurrency(ctx: BaseContext, subjectUserId?: string | null): CurrencyCode | null {
  if (ctx.billingFxDisplayCurrency !== undefined) {
    return ctx.billingFxDisplayCurrency;
  }

  if (subjectUserId && ctx.billingFxDisplayCurrencyByUserId?.has(subjectUserId)) {
    return ctx.billingFxDisplayCurrencyByUserId.get(subjectUserId) ?? null;
  }

  return ctx.user?.displayCurrency ?? null;
}

export async function setBillingFxDisplayCurrencyForSubject(
  ctx: BaseContext,
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
  ctx: BaseContext,
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
  ctx: BaseContext,
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

export function resolveDisplayAmountField<P extends { id: string; amount?: string | null; currency?: string | null }>(
  parent: P,
  ctx: BaseContext,
  amountKey: keyof P & string = "amount",
  currencyKey: keyof P & string = "currency",
  subjectUserId?: string | null
) {
  const displayCurrency = resolveEffectiveDisplayCurrency(ctx, subjectUserId);
  if (!displayCurrency) {
    return null;
  }

  const amount = parent[amountKey];
  const currency = parent[currencyKey];

  return FxDisplayService.convertForDisplay(
    typeof amount === "string" ? amount : null,
    typeof currency === "string" ? parseCurrencyCode(currency) : null,
    displayCurrency,
    parent.id,
    undefined,
    ctx.locale
  );
}

export async function resolveDisplayAmountFields(
  items: readonly { id: string }[],
  ctx: BaseContext,
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
