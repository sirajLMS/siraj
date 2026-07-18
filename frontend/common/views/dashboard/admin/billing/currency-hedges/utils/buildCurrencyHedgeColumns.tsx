// NEW FOR PLAN v5: column builder for the desktop currency-hedges DataGrid,
// lifted out of the inline `useMemo` that previously lived inside
// currencyHedges.desktop.tsx (specs §3 N11 — data-deriving `useMemo` in tier
// is forbidden; only RENDER OPT JUSTIFICATION memos remain in tier). Mirrors
// the precedent set by `exchangeRatesColumns.tsx` (a common `*Columns.tsx`
// file whose `renderCell` JSX uses MUI primitives + shared display components
// — no tier-specific imports).
//
// Type-only import of the ViewModel's `HedgeRow` and `CurrencyHedgesViewModel`
// shapes — safe even though the ViewModel file imports this builder in turn,
// because `import type` is erased at compile time and never creates a runtime
// cycle.
import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import { formatHedgeTimestamp } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/utils/formatHedgeTimestamp";

export function buildCurrencyHedgeColumns(
  labels: Pick<
    CurrencyHedgesViewModel,
    | "currencyColumnLabel"
    | "amountColumnLabel"
    | "hedgeTypeColumnLabel"
    | "notesColumnLabel"
    | "updatedAtColumnLabel"
    | "actionsColumnLabel"
    | "editHedgeLabel"
    | "deleteHedgeLabel"
  >,
  callbacks: {
    readonly onEdit: (row: HedgeRow) => void;
    readonly onDelete: (row: HedgeRow) => void;
  },
  locale: string
): GridColDef<HedgeRow>[] {
  return [
    {
      field: "currency",
      headerName: labels.currencyColumnLabel,
      flex: 1,
      minWidth: 120,
      valueFormatter: value => getCurrencyDisplayName(String(value), locale),
    },
    { field: "amount", headerName: labels.amountColumnLabel, flex: 1, minWidth: 120 },
    { field: "hedgeType", headerName: labels.hedgeTypeColumnLabel, flex: 1, minWidth: 140 },
    { field: "notes", headerName: labels.notesColumnLabel, flex: 1.5, minWidth: 180 },
    {
      field: "updatedAt",
      headerName: labels.updatedAtColumnLabel,
      flex: 1,
      minWidth: 160,
      valueFormatter: value => formatHedgeTimestamp(String(value), locale),
    },
    {
      field: "actions",
      headerName: labels.actionsColumnLabel,
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label={labels.editHedgeLabel} onClick={() => callbacks.onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.deleteHedgeLabel} onClick={() => callbacks.onDelete(row)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];
}
