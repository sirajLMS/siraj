"use client";

import { Box, Chip, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { SupportedPaymentLinkFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { CatalogGridShared } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/__shared__/catalogGridShared";
import type { PaymentCatalogsLabels } from "@/shared/locale";

// VARIANT JUSTIFICATION: entity-specific middle column (`urlAllowlist`) —
// the shared grid handles the 5 common columns. This file supplies only the
// column that differs across catalog kinds.
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
  // identity and re-mounts virtualized rows.
  const extraColumns = useMemo<GridColDef<SupportedPaymentLinkFieldsFragment>[]>(
    () => [
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
    ],
    [pc]
  );

  return (
    <CatalogGridShared
      labels={labels}
      rows={rows}
      loading={loading}
      onEdit={onEdit}
      onDelete={onDelete}
      extraColumns={extraColumns}
    />
  );
}
