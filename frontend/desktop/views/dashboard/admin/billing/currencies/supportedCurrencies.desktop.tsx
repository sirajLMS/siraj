"use client";

import { Alert } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { SupportedCurrenciesViewModel } from "@/frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesView";
import { buildSupportedCurrencyColumns } from "@/frontend/common/views/dashboard/admin/billing/currencies/utils";
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

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid
  const columns = useMemo<GridColDef<DesktopRow>[]>(
    () =>
      buildSupportedCurrencyColumns(
        { flagColumnLabel, codeColumnLabel, symbolColumnLabel, nameColumnLabel, countryColumnLabel },
        locale
      ),
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
