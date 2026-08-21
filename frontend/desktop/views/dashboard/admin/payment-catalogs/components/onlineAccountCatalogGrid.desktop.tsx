"use client";

import { Chip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { SupportedOnlineAccountFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CatalogGridActionHandlers } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { resolveIdentifierKindLabel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/utils/paymentCatalogLabels.utils";
import { CatalogGridShared } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/__shared__/catalogGridShared";
import type { PaymentCatalogsLabels } from "@/shared/locale";

// VARIANT JUSTIFICATION: entity-specific middle column (`identifierKind`) —
// the shared grid handles the 5 common columns. This file supplies only the
// column that differs across catalog kinds.
export interface OnlineAccountCatalogGridDesktopProps extends CatalogGridActionHandlers {
  readonly labels: PaymentCatalogsLabels;
  readonly rows: readonly SupportedOnlineAccountFieldsFragment[];
  readonly loading?: boolean;
}

export function OnlineAccountCatalogGridDesktop({
  labels,
  rows,
  loading = false,
  onEdit,
  onDelete,
}: Readonly<OnlineAccountCatalogGridDesktopProps>) {
  const pc = labels;
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — `renderCell` closures
  // capture labels; without memo every render produces a new column array
  // identity and re-mounts virtualized rows.
  const extraColumns = useMemo<GridColDef<SupportedOnlineAccountFieldsFragment>[]>(
    () => [
      {
        field: "identifierKind",
        headerName: pc.columns.identifierKind,
        width: 180,
        renderCell: ({ row }) => (
          <Chip size="small" label={resolveIdentifierKindLabel(row.identifierKind, pc)} variant="outlined" />
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
