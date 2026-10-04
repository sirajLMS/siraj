import { useMemo } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  buildInvoiceRow,
  buildParentBillingSummary,
} from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type {
  BillingData,
  BillingTranslations,
} from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel.state";

export function useInvoiceRows(
  translations: BillingTranslations,
  data: BillingData
): { invoices: readonly ParentInvoiceRow[]; totalCount: number } {
  const { locale, fxMessages } = translations;
  const { invoicesData } = data;
  const invoices: readonly ParentInvoiceRow[] = useMemo(
    () =>
      (invoicesData?.parentInvoiceHistory?.rows ?? [])
        .filter((row): row is NonNullable<typeof row> => row != null)
        .map(inv =>
          buildInvoiceRow(inv, locale, fxMessages, { staleDefault: true, currencyDefault: CurrencyCode.Usd })
        ),
    [invoicesData?.parentInvoiceHistory, fxMessages, locale]
  );

  const totalCount = invoicesData?.parentInvoiceHistory?.totalCount ?? 0;
  return { invoices, totalCount };
}

export function useBillingSummary(translations: BillingTranslations, data: BillingData): ParentBillingSummary {
  const { locale, fxMessages } = translations;
  const { summaryData } = data;
  return useMemo(() => buildParentBillingSummary(summaryData, locale, fxMessages), [summaryData, locale, fxMessages]);
}
