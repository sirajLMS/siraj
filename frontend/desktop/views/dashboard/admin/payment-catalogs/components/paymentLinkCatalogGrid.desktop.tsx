"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { SupportedPaymentLinkFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { resolvePaymentDirectionLabel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/utils/paymentCatalogLabels.utils";
import { DesktopAppDataGrid, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopLocalizedStringDisplay } from "@/frontend/desktop/components/ui/display";
import type { PaymentCatalogsLabels } from "@/shared/locale";

// VARIANT JUSTIFICATION: extra field rows + loading — the mobile catalog has
// no paired data-grid (it renders `PaymentCatalogCardMobile` inside a plain
// `Box`); the typed row fragment differs from the other two grids. Local
// controller of the data-grid column shape stays in this tier file.
export interface PaymentLinkCatalogGridDesktopProps extends CatalogGridActionHandlers {
  readonly labels: PaymentCatalogsLabels;
  readonly rows: readonly SupportedPaymentLinkFieldsFragment[];
  readonly loading?: boolean;
}

export function PaymentLinkCatalogGridDesktop({
  labels,
  rows,
  loading = false,
  onEdit,
  onDelete,
}: Readonly<PaymentLinkCatalogGridDesktopProps>) {
  const pc = labels;
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — `renderCell` closures
  // capture labels; without memo every render produces a new column array
  // identity and re-mounts virtualized rows. Memo only caches JSX identity;
  // the column defs themselves are constant for a given label set.
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
        renderCell: ({ row }) => <DesktopLocalizedStringDisplay value={row.name} />,
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
      <DesktopAppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={row => row.id ?? ""}
        paginationOptions={{ mode: "client" }}
      />
    </Box>
  );
}
