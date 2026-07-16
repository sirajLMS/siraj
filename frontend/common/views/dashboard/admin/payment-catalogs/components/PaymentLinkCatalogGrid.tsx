"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/common/components/ui";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SupportedPaymentLinkFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { useAppTranslation } from "@/shared/locale";

export interface PaymentLinkCatalogGridProps extends CatalogGridActionHandlers {
  readonly rows: readonly SupportedPaymentLinkFieldsFragment[];
  readonly loading?: boolean;
}

export function PaymentLinkCatalogGrid({
  rows,
  loading = false,
  onEdit,
  onDelete,
}: Readonly<PaymentLinkCatalogGridProps>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
  const pc = t;
  const columns = useMemo<GridColDef<SupportedPaymentLinkFieldsFragment>[]>(
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
        field: "urlAllowlist",
        headerName: pc.columns.urlAllowlist,
        flex: 2,
        minWidth: 220,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ py: 0.5, width: "100%", pointerEvents: "none" }}>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {(row.urlAllowlist ?? []).map(host => (
                <Chip key={host} size="small" label={host} />
              ))}
            </Stack>
          </Box>
        ),
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
      pc.columns.supportedDirections,
      pc.delete,
      pc.columns.status,
      pc.columns.actions,
      pc.columns.urlAllowlist,
      pc.columns.slug,
      pc.columns.name,
      pc.active,
    ]
  );

  return (
    <Box sx={{ width: "100%", minHeight: 400, height: { xs: 480, md: 560 } }}>
      <AppDataGrid rows={rows} columns={columns} loading={loading} getRowId={row => row.id ?? ""} />
    </Box>
  );
}
