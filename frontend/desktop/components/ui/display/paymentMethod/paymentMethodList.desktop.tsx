"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { PaymentMethodDirectionLabels, PaymentMethodTypeLabels } from "@/shared/locale/types/ui";

export type { PaymentMethodRow };

function isPaymentMethodTypeLabelKey(value: string): value is keyof PaymentMethodTypeLabels {
  return (
    value === "mobileWallet" ||
    value === "paymentLink" ||
    value === "onlineAccount" ||
    value === "bankTransfer" ||
    value === "cash" ||
    value === "proofUpload"
  );
}

function isPaymentDirectionLabelKey(value: string): value is keyof PaymentMethodDirectionLabels {
  return value === "in" || value === "out" || value === "both";
}

export type DesktopPaymentMethodListProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly loading?: boolean;
  readonly title?: string;
  readonly emptyMessage?: string;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
};

export function DesktopPaymentMethodList({
  methods,
  loading = false,
  title,
  emptyMessage,
  onEditAction,
  onDeleteAction,
  onSetDefaultAction,
}: DesktopPaymentMethodListProps) {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);
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
            {getPaymentMethodTypeLabel(params.row.type, key => (isPaymentMethodTypeLabelKey(key) ? t.type[key] : ""))}
          </Typography>
        ),
      },
      {
        field: "direction",
        headerName: tList.columnDirection,
        width: 120,
        renderCell: params => (
          <Typography sx={{ typography: "bodyMd" }}>
            {getPaymentMethodDirectionLabel(params.row.direction, key =>
              isPaymentDirectionLabelKey(key) ? t.direction[key] : ""
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
            return (
              <DesktopStatusBadge category="paymentMethod" status={status} label={t.display[status]} size="small" />
            );
          }
          if (params.row.isActive === false) {
            return (
              <DesktopStatusBadge category="paymentMethod" status="inactive" label={t.display.inactive} size="small" />
            );
          }
          return <DesktopStatusBadge category="paymentMethod" status="active" label={t.display.active} size="small" />;
        },
      },
      {
        field: "isDefault",
        headerName: tList.columnDefault,
        width: 120,
        renderCell: params =>
          params.row.isDefault ? (
            <DesktopStatusBadge category="paymentMethod" status="active" label={t.display.defaultBadge} size="small" />
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
        <DesktopAppDataGrid<PaymentMethodRow>
          rows={methods}
          columns={columns}
          getRowId={row => row.id}
          loading={loading}
          autoHeight
          paginationOptions={{ mode: "client" }}
          emptyMessage={emptyMessage ?? tList.empty}
        />
      </Box>
    </BaseCard>
  );
}
