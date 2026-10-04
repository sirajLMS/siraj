"use client";

import { Box, Typography } from "@mui/material";
import type * as React from "react";
import { useMemo } from "react";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import {
  buildPaymentMethodColumns,
  type DataGridSlot,
  type PaymentMethodColumnsLabels,
  type StatusBadgeSlot,
} from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodListShared.parts";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";

//#region Slots

export interface PaymentMethodListSlots {
  readonly StatusBadge: StatusBadgeSlot;
  readonly DataGrid: DataGridSlot;
}

export interface PaymentMethodListSharedProps {
  readonly methods: readonly PaymentMethodRow[];
  readonly loading?: boolean;
  readonly title?: string;
  readonly emptyMessage?: string;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
  readonly slots: PaymentMethodListSlots;
  readonly t: PaymentMethodColumnsLabels;
}

//#endregion

export function PaymentMethodListShared({
  methods,
  loading = false,
  title,
  emptyMessage,
  onEditAction,
  onDeleteAction,
  onSetDefaultAction,
  slots,
  t,
}: Readonly<PaymentMethodListSharedProps>): React.ReactNode {
  const { StatusBadge, DataGrid } = slots;

  const columns = useMemo(
    () => buildPaymentMethodColumns({ t, StatusBadge, onEditAction, onDeleteAction, onSetDefaultAction }),
    [StatusBadge, onDeleteAction, onEditAction, onSetDefaultAction, t]
  );

  return (
    <BaseCard edgeToEdge>
      {title ? (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography sx={{ typography: "titleLg" }}>{title}</Typography>
        </Box>
      ) : null}
      <Box sx={{ width: "100%", minHeight: 280 }}>
        <DataGrid
          rows={methods}
          columns={columns}
          getRowId={row => row.id}
          loading={loading}
          autoHeight
          paginationOptions={{ mode: "client" }}
          emptyMessage={emptyMessage ?? t.list.empty}
        />
      </Box>
    </BaseCard>
  );
}
