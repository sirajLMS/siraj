"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type * as React from "react";
import { TooltipIconButton } from "@/frontend/common/components/ui";
import {
  isPaymentDirectionLabelKey,
  isPaymentMethodTypeLabelKey,
} from "@/frontend/common/components/ui/display/paymentMethod/paymentMethodLabelHelpers";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import type {
  PaymentMethodDirectionLabels,
  PaymentMethodDisplayLabels,
  PaymentMethodListLabels,
  PaymentMethodTypeLabels,
} from "@/shared/locale/types/ui";

/**
 * Column schema for `PaymentMethodListShared`: the slot contracts the scaffold
 * requires from each viewport tier and the DataGrid column builder (label,
 * type, direction, status, default badge, and row actions).
 */

export type StatusBadgeSlot = React.ComponentType<{
  category: "paymentMethod";
  status: string;
  label: string;
  size: "small";
}>;

export type DataGridSlot = React.ComponentType<{
  readonly rows: readonly PaymentMethodRow[];
  readonly columns: GridColDef<PaymentMethodRow>[];
  readonly getRowId: (row: PaymentMethodRow) => string;
  readonly loading?: boolean;
  readonly autoHeight?: boolean;
  readonly paginationOptions: { mode: "client" };
  readonly emptyMessage?: string;
}>;

export interface PaymentMethodColumnsLabels {
  readonly display: PaymentMethodDisplayLabels;
  readonly list: PaymentMethodListLabels;
  readonly type: PaymentMethodTypeLabels;
  readonly direction: PaymentMethodDirectionLabels;
}

interface BuildPaymentMethodColumnsParams {
  readonly t: PaymentMethodColumnsLabels;
  readonly StatusBadge: StatusBadgeSlot;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
}

export function buildPaymentMethodColumns({
  t,
  StatusBadge,
  onEditAction,
  onDeleteAction,
  onSetDefaultAction,
}: BuildPaymentMethodColumnsParams): GridColDef<PaymentMethodRow>[] {
  const tList = t.list;
  return [
    {
      field: "label",
      headerName: tList.columnLabel,
      flex: 1.2,
      minWidth: 180,
      renderCell: params => (
        <Typography sx={{ typography: "bodyMd" }}>
          {params.row.label?.trim() ?? params.row.catalogSlug ?? "—"}
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
            <TooltipIconButton
              label={tList.setDefault}
              onClick={() => onSetDefaultAction(params.row.id)}
              icon={<StarOutlinedIcon fontSize="small" />}
            />
          ) : null}
          {onEditAction ? (
            <TooltipIconButton
              label={tList.edit}
              onClick={() => onEditAction(params.row.id)}
              icon={<EditOutlinedIcon fontSize="small" />}
            />
          ) : null}
          {onDeleteAction ? (
            <TooltipIconButton
              label={tList.delete}
              onClick={() => onDeleteAction(params.row.id)}
              icon={<DeleteOutlinedIcon fontSize="small" />}
            />
          ) : null}
        </Stack>
      ),
    },
  ];
}
