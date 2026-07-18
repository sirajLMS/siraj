"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { PaymentMethodDisplay } from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplay";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { useAppTranslation } from "@/shared/locale";

export type { PaymentMethodRow };

export type PaymentMethodListProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly loading?: boolean;
  readonly title?: string;
  readonly emptyMessage?: string;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
};

export function PaymentMethodList({
  methods,
  loading = false,
  title,
  emptyMessage,
  onEditAction,
  onDeleteAction,
  onSetDefaultAction,
}: PaymentMethodListProps) {
  const t = useAppTranslation().uiTranslations.paymentMethod;
  const tList = t.list;

  const columns = useMemo<GridColDef<PaymentMethodRow>[]>(() => {
    return [
      {
        field: "label",
        headerName: tList.columnLabel,
        flex: 1.2,
        minWidth: 180,
        renderCell: params => (
          <Typography sx={{ typography: "bodyMd" }}>
            {params.row.label?.trim() || params.row.catalogSlug || "—"}
          </Typography>
        ),
      },
      {
        field: "type",
        headerName: tList.columnType,
        width: 160,
        renderCell: params => (
          <Typography sx={{ typography: "bodyMd" }}>
            {getPaymentMethodTypeLabel(params.row.type, key => t.type[key as keyof typeof t.type] ?? "")}
          </Typography>
        ),
      },
      {
        field: "direction",
        headerName: tList.columnDirection,
        width: 120,
        renderCell: params => (
          <Typography sx={{ typography: "bodyMd" }}>
            {getPaymentMethodDirectionLabel(
              params.row.direction,
              key => t.direction[key as keyof typeof t.direction] ?? ""
            )}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: tList.columnStatus,
        width: 140,
        renderCell: params => {
          if (params.row.type === PaymentMethodType.BankTransfer) {
            const status = params.row.verifiedAt ? "verified" : "unverified";
            return <StatusBadge category="paymentMethod" status={status} label={t.display[status]} size="small" />;
          }
          if (params.row.isActive === false) {
            return <StatusBadge category="paymentMethod" status="inactive" label={t.display.inactive} size="small" />;
          }
          return <StatusBadge category="paymentMethod" status="active" label={t.display.active} size="small" />;
        },
      },
      {
        field: "isDefault",
        headerName: tList.columnDefault,
        width: 120,
        renderCell: params =>
          params.row.isDefault ? (
            <StatusBadge category="paymentMethod" status="active" label={t.display.defaultBadge} size="small" />
          ) : null,
      },
      {
        field: "actions",
        headerName: "",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: params => (
          <Stack sx={{ flexDirection: "row", gap: 0.5 }}>
            {!params.row.isDefault && onSetDefaultAction ? (
              <IconButton aria-label={tList.setDefault} size="small" onClick={() => onSetDefaultAction(params.row.id)}>
                <StarOutlinedIcon fontSize="small" />
              </IconButton>
            ) : null}
            {onEditAction ? (
              <IconButton aria-label={tList.edit} size="small" onClick={() => onEditAction(params.row.id)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            ) : null}
            {onDeleteAction ? (
              <IconButton aria-label={tList.delete} size="small" onClick={() => onDeleteAction(params.row.id)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
        ),
      },
    ];
  }, [onDeleteAction, onEditAction, onSetDefaultAction, t, tList]);

  return (
    <BaseCard edgeToEdge>
      {title ? (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography sx={{ typography: "titleLg" }}>{title}</Typography>
        </Box>
      ) : null}
      <Box sx={{ width: "100%", minHeight: 280 }}>
        <AppDataGrid<PaymentMethodRow>
          rows={methods}
          columns={columns}
          getRowId={row => row.id}
          loading={loading}
          autoHeight
          emptyMessage={emptyMessage ?? tList.empty}
        />
      </Box>
    </BaseCard>
  );
}

export { PaymentMethodDisplay };
