"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/common/components/ui";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { IdentifierKind, PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SupportedOnlineAccountFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { CatalogGridActionHandlers } from "@/frontend/views/dashboard/admin/payment-catalogs/types";

export interface OnlineAccountCatalogGridProps extends CatalogGridActionHandlers {
  readonly rows: readonly SupportedOnlineAccountFieldsFragment[];
  readonly loading?: boolean;
}

function resolveIdentifierKindLabel(
  kind: IdentifierKind | null | undefined,
  t: ReturnType<typeof useTranslations<"dashboard.paymentCatalogs">>
): string {
  switch (kind) {
    case IdentifierKind.Email:
      return t("identifierKinds.email");
    case IdentifierKind.Handle:
      return t("identifierKinds.handle");
    case IdentifierKind.EmailOrHandle:
      return t("identifierKinds.emailOrHandle");
    default:
      return t("notSet");
  }
}

export function OnlineAccountCatalogGrid({
  rows,
  loading = false,
  onEdit,
  onDelete,
}: Readonly<OnlineAccountCatalogGridProps>) {
  const t = useTranslations("dashboard.paymentCatalogs");
  const columns = useMemo<GridColDef<SupportedOnlineAccountFieldsFragment>[]>(
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
        field: "identifierKind",
        headerName: t("columns.identifierKind"),
        width: 180,
        renderCell: ({ row }) => (
          <Chip size="small" label={resolveIdentifierKindLabel(row.identifierKind, t)} variant="outlined" />
        ),
      },
      {
        field: "supportedDirections",
        headerName: t("columns.supportedDirections"),
        width: 120,
        renderCell: ({ row }) => {
          const dir = row.supportedDirections;
          if (!dir) return t("notSet");
          if (dir === PaymentDirection.Payin) return t("directions.payin");
          if (dir === PaymentDirection.Payout) return t("directions.payout");
          return t("directions.both");
        },
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
    <Box sx={{ width: "100%", minHeight: 400, height: { xs: 480, md: 560 } }}>
      <AppDataGrid rows={rows} columns={columns} loading={loading} getRowId={row => row.id ?? ""} />
    </Box>
  );
}
