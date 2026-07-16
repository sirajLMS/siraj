"use client";

import { Alert } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppDataGrid, PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, currencies, getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useAppTranslation } from "@/shared/locale";

export function SupportedCurrenciesContainer() {
  const t = useAppTranslation().dashboardTranslations.billing;
  const locale = useAppLocale();

  const rows = useMemo(
    () =>
      currencies.map((currency, index) => ({
        id: `${currency.code}-${index}`,
        ...currency,
      })),
    []
  );

  const columns = useMemo<GridColDef<CurrencyOption & { id: string }>[]>(
    () => [
      {
        field: "flagEmoji",
        headerName: t.supportedCurrencies.flag,
        width: 80,
        sortable: false,
        renderCell: ({ row }) => <span aria-hidden>{row.flagEmoji}</span>,
      },
      { field: "code", headerName: t.supportedCurrencies.code, flex: 1, minWidth: 100 },
      { field: "symbol", headerName: t.supportedCurrencies.symbol, width: 120 },
      {
        field: "name",
        headerName: t.supportedCurrencies.name,
        flex: 1.5,
        minWidth: 180,
        valueGetter: (_value, row) => getCurrencyDisplayName(row.code, locale),
      },
      {
        field: "countryCode",
        headerName: t.supportedCurrencies.country,
        flex: 1,
        minWidth: 140,
        valueGetter: (_value, row) => getCountryDisplayName(row.countryCode, locale),
      },
    ],
    [locale, t]
  );

  return (
    <RequirePermission permissions={AppPermission.BillingViewExchangeRates}>
      <PageContainer>
        <PageHeader title={t.supportedCurrencies.pageTitle} subtitle={t.supportedCurrencies.pageSubtitle} />
        <AppDataGrid
          rows={rows}
          columns={columns}
          emptyMessage={t.supportedCurrencies.empty}
          getRowId={row => row.id}
          autoHeight
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          {t.supportedCurrencies.footerNote}
        </Alert>
      </PageContainer>
    </RequirePermission>
  );
}
