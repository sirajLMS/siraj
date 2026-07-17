"use client";

import { useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { currencies } from "@/frontend/common/lib/currency";
import { SupportedCurrenciesView } from "@/frontend/common/views/dashboard/admin/billing/currencies/supportedCurrenciesView";
import { useAppTranslation } from "@/shared/locale";

export function SupportedCurrenciesContainer() {
  const t = useAppTranslation().dashboardTranslations.billing;

  const rows = useMemo(
    () =>
      currencies.map((currency, index) => ({
        id: `${currency.code}-${index}`,
        ...currency,
      })),
    []
  );

  return (
    <RequirePermission permissions={AppPermission.BillingViewExchangeRates}>
      <SupportedCurrenciesView
        rows={rows}
        emptyMessage={t.supportedCurrencies.empty}
        footerNote={t.supportedCurrencies.footerNote}
        pageTitle={t.supportedCurrencies.pageTitle}
        pageSubtitle={t.supportedCurrencies.pageSubtitle}
        flagColumnLabel={t.supportedCurrencies.flag}
        codeColumnLabel={t.supportedCurrencies.code}
        symbolColumnLabel={t.supportedCurrencies.symbol}
        nameColumnLabel={t.supportedCurrencies.name}
        countryColumnLabel={t.supportedCurrencies.country}
      />
    </RequirePermission>
  );
}
