"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/common/components/ui";
import { CountryDisplay, CurrencyDisplay, LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SupportedMobileWalletFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { useAppTranslation } from "@/shared/locale/client";

export interface MobileWalletCatalogGridProps extends CatalogGridActionHandlers {
  readonly rows: readonly SupportedMobileWalletFieldsFragment[];
  readonly loading?: boolean;
}

export function MobileWalletCatalogGrid({
  rows,
  loading = false,
  onEdit,
  onDelete,
}: Readonly<MobileWalletCatalogGridProps>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
  const pc = t;
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
        renderCell: ({ row }) => <LocalizedStringDisplay value={row.name} />,
      },
      {
        field: "countryCode",
        headerName: pc.columns.country,
        width: 140,
        renderCell: ({ row }) => <CountryDisplay code={row.countryCode} />,
      },
      {
        field: "currencyCode",
        headerName: pc.columns.currency,
        width: 140,
        renderCell: ({ row }) => <CurrencyDisplay code={row.currencyCode} />,
      },
      {
        field: "supportedDirections",
        headerName: pc.columns.supportedDirections,
        width: 120,
        renderCell: ({ row }) => {
          const dir = row.supportedDirections;
          if (!dir) return pc.notSet;
          if (dir === PaymentDirection.Payin) return pc.directions.payin;
          if (dir === PaymentDirection.Payout) return pc.directions.payout;
          return pc.directions.both;
        },
      },
      {
        field: "isActive",
        headerName: pc.columns.status,
        width: 120,
        renderCell: ({ row }) => (
          <StatusBadge
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
    [
      onDelete,
      onEdit,
      pc.notSet,
      pc.inactive,
      pc.edit,
      pc.directions.payout,
      pc.directions.payin,
      pc.directions.both,
      pc.delete,
      pc.columns.slug,
      pc.columns.supportedDirections,
      pc.columns.name,
      pc.columns.actions,
      pc.columns.status,
      pc.columns.currency,
      pc.columns.country,
      pc.active,
    ]
  );

  return (
    <Box sx={{ width: "100%", minHeight: 400, height: { xs: 480, md: 560 } }}>
      <AppDataGrid rows={rows} columns={columns} loading={loading} getRowId={row => row.id ?? ""} />
    </Box>
  );
}
