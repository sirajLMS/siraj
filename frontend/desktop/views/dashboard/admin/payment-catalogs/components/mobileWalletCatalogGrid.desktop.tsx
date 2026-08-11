"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { SupportedMobileWalletFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { DesktopCountryDisplay, DesktopCurrencyDisplay } from "@/frontend/desktop/components/ui/display";
import { CatalogGridShared } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/__shared__/catalogGridShared";
import type { PaymentCatalogsLabels } from "@/shared/locale";

// VARIANT JUSTIFICATION: entity-specific middle columns (`countryCode`,
// `currencyCode`) — the shared grid handles the 5 common columns. This file
// supplies only the two columns that differ across catalog kinds.
export interface MobileWalletCatalogGridDesktopProps extends CatalogGridActionHandlers {
  readonly labels: PaymentCatalogsLabels;
  readonly rows: readonly SupportedMobileWalletFieldsFragment[];
  readonly loading?: boolean;
}

export function MobileWalletCatalogGridDesktop({
  labels,
  rows,
  loading = false,
  onEdit,
  onDelete,
}: Readonly<MobileWalletCatalogGridDesktopProps>) {
  const pc = labels;
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — `renderCell` closures
  // capture the labels; without memo every render produces a new column
  // array identity and re-mounts virtualized rows.
  const extraColumns = useMemo<GridColDef<SupportedMobileWalletFieldsFragment>[]>(
    () => [
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
