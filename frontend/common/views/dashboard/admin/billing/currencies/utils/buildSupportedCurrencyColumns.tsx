// Column builder for the desktop supported-currencies
// DataGrid, lifted out of the inline `useMemo` that previously lived inside
// supportedCurrencies.desktop.tsx (specs §3 N11). Mirrors the
// `exchangeRatesColumns.tsx` precedent.
import { EditOutlined, ToggleOffOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import type {
  SupportedCurrenciesActionLabels,
  SupportedCurrenciesColumnLabels,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/types/supportedCurrencies.types";
import type { SupportedCurrencyRow } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";

type DesktopCurrencyRow = SupportedCurrencyRow;

export function buildSupportedCurrencyColumns(
  labels: SupportedCurrenciesColumnLabels & Pick<SupportedCurrenciesActionLabels, "editLabel" | "deactivateLabel">,
  handlers: {
    readonly onEdit: (row: SupportedCurrencyRow) => void;
    readonly onDeactivate: (row: SupportedCurrencyRow) => void;
  },
  canManage: boolean,
  locale: string
): GridColDef<DesktopCurrencyRow>[] {
  const baseColumns: GridColDef<DesktopCurrencyRow>[] = [
    {
      field: "flagEmoji",
      headerName: labels.flag,
      width: 60,
      sortable: false,
      renderCell: ({ row }) => (
        <Box component="span" aria-hidden sx={theme => ({ fontSize: theme.typography.headlineMd.fontSize })}>
          {row.flagEmoji}
        </Box>
      ),
    },
    {
      field: "code",
      headerName: labels.code,
      flex: 0.8,
      minWidth: 80,
    },
    {
      field: "symbol",
      headerName: labels.symbol,
      flex: 0.6,
      minWidth: 70,
    },
    {
      field: "name",
      headerName: labels.name,
      flex: 1.2,
      minWidth: 120,
      valueGetter: (_value, row) => getCurrencyDisplayName(row.code, locale),
    },
    {
      field: "countryCode",
      headerName: labels.country,
      flex: 1,
      minWidth: 100,
      valueGetter: (_value, row) => getCountryDisplayName(row.countryCode, locale),
    },
    {
      field: "isActive",
      headerName: labels.active,
      flex: 0.6,
      minWidth: 80,
      type: "boolean",
    },
  ];

  if (!canManage) {
    return baseColumns;
  }

  return [
    ...baseColumns,
    {
      field: "actions",
      headerName: labels.actions,
      width: 100,
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
    },
  ];
}
