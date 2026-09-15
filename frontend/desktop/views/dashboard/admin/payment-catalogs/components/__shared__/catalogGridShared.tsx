"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { PaymentCatalogRow } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { resolvePaymentDirectionLabel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/utils/paymentCatalogLabels.utils";
import { DesktopAppDataGrid, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopLocalizedStringDisplay } from "@/frontend/desktop/components/ui/display";
import type { PaymentCatalogsLabels } from "@/shared/locale";

export interface CatalogGridSharedProps<R extends PaymentCatalogRow> {
  readonly labels: PaymentCatalogsLabels;
  readonly rows: readonly R[];
  readonly loading?: boolean;
  readonly onEdit: (row: R) => void;
  readonly onDelete: (row: R) => void;
  /** Entity-specific columns inserted between `name` and `supportedDirections`. */
  readonly extraColumns: GridColDef<R>[];
}

/**
 * Shared catalog grid shell: `Box` wrapper + `DesktopAppDataGrid` with
 * the 5 common columns (slug, name, supportedDirections, isActive, actions).
 * Consumers supply entity-specific middle columns via `extraColumns`.
 */
export function CatalogGridShared<R extends PaymentCatalogRow>({
  labels: pc,
  rows,
  loading = false,
  onEdit,
  onDelete,
  extraColumns,
}: Readonly<CatalogGridSharedProps<R>>) {
  const columns: GridColDef<R>[] = [
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
    ...extraColumns,
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
  ];

  return (
    <Box sx={{ width: "100%", minHeight: 400, height: { xs: 480, md: 560 } }}>
      <DesktopAppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={row => row.id ?? ""}
        emptyMessage={pc.notSet}
        ariaLabel={pc.pageTitle}
        paginationOptions={{ mode: "client" }}
      />
    </Box>
  );
}
