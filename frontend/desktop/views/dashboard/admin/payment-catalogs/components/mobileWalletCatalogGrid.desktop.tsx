"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { SupportedMobileWalletFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { resolvePaymentDirectionLabel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/utils/paymentCatalogLabels.utils";
import { DesktopAppDataGrid, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import {
  DesktopCountryDisplay,
  DesktopCurrencyDisplay,
  DesktopLocalizedStringDisplay,
} from "@/frontend/desktop/components/ui/display";
import { useAppTranslation } from "@/shared/locale";

// VARIANT JUSTIFICATION: extra field rows + loading — the mobile catalog has
// no paired data-grid (it renders `PaymentCatalogCardMobile` inside a plain
// `Box`); the typed row fragment differs from the other two grids. Local
// controller of the data-grid column shape stays in this tier file.
export interface MobileWalletCatalogGridDesktopProps extends CatalogGridActionHandlers {
  readonly rows: readonly SupportedMobileWalletFieldsFragment[];
  readonly loading?: boolean;
}

export function MobileWalletCatalogGridDesktop({
  rows,
  loading = false,
  onEdit,
  onDelete,
}: Readonly<MobileWalletCatalogGridDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
  const pc = t;
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — `renderCell` closures
  // capture the labels; without memo every render produces a new column
  // array identity and re-mounts virtualized rows. Memo only caches JSX
  // identity; the column defs themselves are constant for a given label set.
  const columns = useMemo<GridColDef<SupportedMobileWalletFieldsFragment>[]>(
    () => [
      {
        field: "slug",
        headerName: pc.columns.slug,
        flex: 1,
        minWidth: 140,
      },
      {
        field: "name",
        headerName: pc.columns.name,
        flex: 1.5,
        minWidth: 180,
        renderCell: ({ row }) => <DesktopLocalizedStringDisplay value={row.name} />,
      },
      {
        field: "countryCode",
        headerName: pc.columns.country,
        width: 140,
        renderCell: ({ row }) => <DesktopCountryDisplay code={row.countryCode} />,
      },
      {
        field: "currencyCode",
        headerName: pc.columns.currency,
        width: 140,
        renderCell: ({ row }) => <DesktopCurrencyDisplay code={row.currencyCode} />,
      },
      {
        field: "supportedDirections",
        headerName: pc.columns.supportedDirections,
        width: 120,
        renderCell: ({ row }) => resolvePaymentDirectionLabel(row.supportedDirections, pc),
      },
      {
        field: "isActive",
        headerName: pc.columns.status,
        width: 120,
        renderCell: ({ row }) => (
          <DesktopStatusBadge
            category="paymentMethod"
            status={row.isActive ? "active" : "inactive"}
            label={row.isActive ? pc.active : pc.inactive}
          />
        ),
      },
      {
        field: "actions",
        headerName: pc.columns.actions,
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" aria-label={pc.edit} onClick={() => onEdit(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={pc.delete} onClick={() => onDelete(row)}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [onDelete, onEdit, pc]
  );

  return (
    <Box sx={{ width: "100%", minHeight: 400, height: { xs: 480, md: 560 } }}>
      <DesktopAppDataGrid rows={rows} columns={columns} loading={loading} getRowId={row => row.id ?? ""} />
    </Box>
  );
}
