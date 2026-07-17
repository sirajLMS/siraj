"use client";

import { Alert } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { SupportedCurrenciesViewModel } from "@/frontend/common/views/dashboard/admin/billing/currencies/supportedCurrenciesView";
import { DesktopAppDataGrid, DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

type DesktopRow = CurrencyOption & { readonly id: string };

export function SupportedCurrenciesDesktopView({
  rows,
  emptyMessage,
  footerNote,
  pageTitle,
  pageSubtitle,
  flagColumnLabel,
  codeColumnLabel,
  symbolColumnLabel,
  nameColumnLabel,
  countryColumnLabel,
}: Readonly<SupportedCurrenciesViewModel>) {
  const locale = useAppLocale();

  const columns = useMemo<GridColDef<DesktopRow>[]>(
    () => [
      {
        field: "flagEmoji",
        headerName: flagColumnLabel,
        width: 80,
        sortable: false,
        renderCell: ({ row }) => <span aria-hidden>{row.flagEmoji}</span>,
      },
      { field: "code", headerName: codeColumnLabel, flex: 1, minWidth: 100 },
      { field: "symbol", headerName: symbolColumnLabel, width: 120 },
      {
        field: "name",
        headerName: nameColumnLabel,
        flex: 1.5,
        minWidth: 180,
        valueGetter: (_value, row) => getCurrencyDisplayName(row.code, locale),
      },
      {
        field: "countryCode",
        headerName: countryColumnLabel,
        flex: 1,
        minWidth: 140,
        valueGetter: (_value, row) => getCountryDisplayName(row.countryCode, locale),
      },
    ],
    [flagColumnLabel, codeColumnLabel, symbolColumnLabel, nameColumnLabel, countryColumnLabel, locale]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={pageTitle} subtitle={pageSubtitle} />
      <DesktopAppDataGrid
        rows={rows as readonly DesktopRow[]}
        columns={columns}
        emptyMessage={emptyMessage}
        getRowId={row => row.id}
        autoHeight
      />
      <Alert severity="info" sx={{ mt: 2 }}>
        {footerNote}
      </Alert>
    </DesktopPageContainer>
  );
}
