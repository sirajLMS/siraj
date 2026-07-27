// Column builder for the desktop supported-currencies
// DataGrid, lifted out of the inline `useMemo` that previously lived inside
// supportedCurrencies.desktop.tsx (specs §3 N11). Mirrors the
// `exchangeRatesColumns.tsx` precedent.
import { EditOutlined, ToggleOffOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import type {
  SupportedCurrenciesViewModel,
  SupportedCurrencyRow,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";

type DesktopCurrencyRow = SupportedCurrencyRow;

export function buildSupportedCurrencyColumns(
  labels: Pick<
    SupportedCurrenciesViewModel,
    | "flagColumnLabel"
    | "codeColumnLabel"
    | "symbolColumnLabel"
    | "nameColumnLabel"
    | "countryColumnLabel"
    | "activeColumnLabel"
    | "actionsColumnLabel"
    | "editLabel"
    | "deactivateLabel"
  >,
  handlers: {
    readonly onEdit: (row: DesktopCurrencyRow) => void;
    readonly onDeactivate: (row: DesktopCurrencyRow) => void;
  },
  canManage: boolean,
  locale: string
): GridColDef<DesktopCurrencyRow>[] {
  const columns: GridColDef<DesktopCurrencyRow>[] = [
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
    {
      field: "isActive",
      headerName: labels.activeColumnLabel,
      width: 100,
      type: "boolean",
    },
  ];

  if (canManage) {
    columns.push({
      field: "actions",
      headerName: labels.actionsColumnLabel,
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label={labels.editLabel} onClick={() => handlers.onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          {row.isActive ? (
            <IconButton size="small" aria-label={labels.deactivateLabel} onClick={() => handlers.onDeactivate(row)}>
              <ToggleOffOutlined fontSize="small" />
            </IconButton>
          ) : null}
        </Stack>
      ),
    });
  }

  return columns;
}
