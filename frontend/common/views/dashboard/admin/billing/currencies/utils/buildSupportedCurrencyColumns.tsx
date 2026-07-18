// NEW FOR PLAN v5: column builder for the desktop supported-currencies
// DataGrid, lifted out of the inline `useMemo` that previously lived inside
// supportedCurrencies.desktop.tsx (specs §3 N11). Mirrors the
// `exchangeRatesColumns.tsx` precedent.
import type { GridColDef } from "@mui/x-data-grid";
import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import type { SupportedCurrenciesViewModel } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";

type DesktopCurrencyRow = CurrencyOption & { readonly id: string };

export function buildSupportedCurrencyColumns(
  labels: Pick<
    SupportedCurrenciesViewModel,
    "flagColumnLabel" | "codeColumnLabel" | "symbolColumnLabel" | "nameColumnLabel" | "countryColumnLabel"
  >,
  locale: string
): GridColDef<DesktopCurrencyRow>[] {
  return [
    {
      field: "flagEmoji",
      headerName: labels.flagColumnLabel,
      width: 80,
      sortable: false,
      renderCell: ({ row }) => <span aria-hidden>{row.flagEmoji}</span>,
    },
    { field: "code", headerName: labels.codeColumnLabel, flex: 1, minWidth: 100 },
    { field: "symbol", headerName: labels.symbolColumnLabel, width: 120 },
    {
      field: "name",
      headerName: labels.nameColumnLabel,
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row) => getCurrencyDisplayName(row.code, locale),
    },
    {
      field: "countryCode",
      headerName: labels.countryColumnLabel,
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => getCountryDisplayName(row.countryCode, locale),
    },
  ];
}
