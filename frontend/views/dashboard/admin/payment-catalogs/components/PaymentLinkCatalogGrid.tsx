"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import { LocalizedStringDisplay } from "@/frontend/components/ui/display";
import type { SupportedPaymentLinkFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/views/dashboard/admin/payment-catalogs/types";

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
  const t = useTranslations("dashboard.paymentCatalogs");
  const columns = useMemo<GridColDef<SupportedPaymentLinkFieldsFragment>[]>(
    () => [
      {
        field: "slug",
        headerName: t("columns.slug"),
        flex: 1,
        minWidth: 140,
      },
      {
        field: "name",
        headerName: t("columns.name"),
        flex: 1.5,
        minWidth: 180,
        renderCell: ({ row }) => <LocalizedStringDisplay value={row.name} />,
      },
      {
        field: "urlAllowlist",
        headerName: t("columns.urlAllowlist"),
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
        field: "isActive",
        headerName: t("columns.status"),
        width: 120,
        renderCell: ({ row }) => (
          <StatusBadge
            category="paymentMethod"
            status={row.isActive ? "active" : "inactive"}
            label={row.isActive ? t("active") : t("inactive")}
          />
        ),
      },
      {
        field: "actions",
        headerName: t("columns.actions"),
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" aria-label={t("edit")} onClick={() => onEdit(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("delete")} onClick={() => onDelete(row)}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [onDelete, onEdit, t]
  );

  return (
    <Box sx={{ width: "100%", height: 560 }}>
      <AppDataGrid rows={rows} columns={columns} loading={loading} getRowId={row => row.id ?? ""} />
    </Box>
  );
}
