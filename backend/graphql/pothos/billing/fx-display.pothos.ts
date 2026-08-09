import { BillingRepository, ParentRepository, UserRepository } from "@/backend/db/repo";
import type { CurrencyCode } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { FxDisplayService } from "@/backend/services/billing/fx-display.service";
import type { DisplayAmountReturnType } from "@/backend/types";
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

  const user = await UserRepository.findSafeById(subjectUserId);
  ctx.billingFxDisplayCurrency = user?.displayCurrency ?? null;
}

export async function setBillingFxDisplayCurrencyForInvoiceParent(
  ctx: BaseContext,
  invoiceId: string,
  callerUserId: string
): Promise<void> {
  const invoice = await BillingRepository.getInvoiceById(invoiceId);
  if (!invoice?.parentId) {
    return;
  }

  const parentUserId = await ParentRepository.findUserIdByParentId(invoice.parentId);
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
    const currencies = await UserRepository.findDisplayCurrenciesByIds(missingIds);
    for (const [id, displayCurrency] of currencies) {
      map.set(id, displayCurrency);
    }
  }

  ctx.billingFxDisplayCurrencyByUserId = map;
}

export function resolveDisplayAmountField<P extends { id: string }>(
  parent: P,
  ctx: BaseContext,
  amountKey: keyof P & string = "amount" as keyof P & string,
  currencyKey: keyof P & string = "currency" as keyof P & string,
  subjectUserId?: string | null
) {
  const displayCurrency = resolveEffectiveDisplayCurrency(ctx, subjectUserId);
  if (!displayCurrency) {
    return null;
  }

  return FxDisplayService.convertForDisplay(
    parent[amountKey] as string | null | undefined,
    parseCurrencyCode(parent[currencyKey] as string | null | undefined),
    displayCurrency,
    parent.id,
    undefined,
    ctx.locale
  );
}

export async function resolveDisplayAmountFields(
  parents: Record<string, unknown>[],
  ctx: BaseContext,
  amountKey: string,
  currencyKey: string,
  subjectUserIdKey?: string | null
): Promise<Map<string, DisplayAmountReturnType | null>> {
  const map = new Map<string, DisplayAmountReturnType | null>();
  await Promise.all(
    parents.map(async parent => {
      const parentId = parent.id as string;
      const displayCurrency = resolveEffectiveDisplayCurrency(
        ctx,
        subjectUserIdKey ? (parent[subjectUserIdKey] as string | null | undefined) : null
      );
      if (!displayCurrency) {
        map.set(parentId, null);
        return;
      }

      const amount = parent[amountKey] as string | null | undefined;
      const currencyStr = parent[currencyKey] as string | null | undefined;
      if (amount == null || currencyStr == null) {
        map.set(parentId, null);
        return;
      }

      const result = await FxDisplayService.convertForDisplay(
        amount,
        parseCurrencyCode(currencyStr),
        displayCurrency,
        parentId,
        undefined,
        ctx.locale
      );
      map.set(parentId, result);
    })
  );
  return map;
}
