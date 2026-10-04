"use client";

import { Stack, Typography } from "@mui/material";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobilePaymentMethodListCard } from "@/frontend/mobile/components/ui/display/paymentMethod/paymentMethodList.mobile.parts";
import { Translation, useAppTranslation } from "@/shared/locale";

export type MobilePaymentMethodListProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly loading?: boolean;
  readonly title?: string;
  readonly emptyMessage?: string;
  readonly onEditAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly onSetDefaultAction?: (id: string) => void;
};

export function MobilePaymentMethodList({
  methods,
  loading = false,
  title,
  emptyMessage,
  onEditAction,
  onDeleteAction,
  onSetDefaultAction,
}: MobilePaymentMethodListProps) {
  const tList = useAppTranslation(Translation.Ui.PaymentMethod).list;

  if (loading) {
    return (
      <MobileBaseCard edgeToEdge={false}>
        <Typography sx={{ typography: "bodyMd", p: 2 }}>{tList.empty}</Typography>
      </MobileBaseCard>
    );
  }

  if (methods.length === 0) {
    return (
      <MobileBaseCard edgeToEdge={false}>
        <Typography sx={{ typography: "bodyMd", p: 2 }}>{emptyMessage ?? tList.empty}</Typography>
      </MobileBaseCard>
    );
  }

  return (
    <Stack spacing={1.5}>
      {title ? <Typography sx={{ typography: "titleLg", px: 0.5 }}>{title}</Typography> : null}

      {methods.map(row => (
        <MobilePaymentMethodListCard
          key={row.id}
          row={row}
          onEditAction={onEditAction}
          onDeleteAction={onDeleteAction}
          onSetDefaultAction={onSetDefaultAction}
        />
      ))}
    </Stack>
  );
}
