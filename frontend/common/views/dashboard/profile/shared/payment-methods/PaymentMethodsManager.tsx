"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Stack } from "@mui/material";
import type { ComponentType } from "react";
import { ErrorState, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { PaymentMethodListProps } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentMethodDeleteDialog } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodDeleteDialog";
import {
  PaymentMethodFormDialogWrapped,
  VerifyBankTransferButtons,
} from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsManager.parts";
import { usePaymentMethodsManagerViewModel } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodsManagerViewModel";
import type { PaymentMethodManagerLabels } from "@/shared/locale/types/ui";

export type PaymentMethodsSlot = "payin" | "payout";

/**
 * Tier-selected list renderer injected by the desktop/mobile tab wrappers so the
 * shared manager never picks a viewport-specific presentation on its own.
 */
type PaymentMethodsListView = ComponentType<PaymentMethodListProps>;

export type PaymentMethodsManagerProps = {
  readonly targetUserId: string;
  readonly slot: PaymentMethodsSlot;
  readonly canManage: boolean;
  readonly ListView: PaymentMethodsListView;
};

function renderEmptyState(t: PaymentMethodManagerLabels, refetch: () => Promise<unknown>) {
  return (
    <ErrorState
      embedded
      message={t.loadError}
      retryLabel={t.retry}
      onRetry={async () => {
        await refetch();
      }}
    />
  );
}

function renderAddButton(t: PaymentMethodManagerLabels, onClick: () => void) {
  return (
    <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
      <PrimaryPageAction startIcon={<AddOutlinedIcon />} onClick={onClick}>
        {t.add}
      </PrimaryPageAction>
    </Stack>
  );
}

export function PaymentMethodsManager({ targetUserId, slot, canManage, ListView }: PaymentMethodsManagerProps) {
  const state = usePaymentMethodsManagerViewModel({ targetUserId, slot, canManage });
  const { t, methods, error, refetchData, busy } = state;

  if (error && methods.length === 0) {
    return renderEmptyState(t, refetchData);
  }

  return (
    <Stack spacing={2}>
      {canManage
        ? renderAddButton(t, () => {
            state.setEditMethod(null);
            state.setFormOpen(true);
          })
        : null}

      <ListView
        methods={methods}
        loading={busy}
        title={t.listTitle}
        emptyMessage={t.empty}
        onEditAction={canManage ? state.handleEdit : undefined}
        onDeleteAction={canManage ? id => state.setDeleteId(id) : undefined}
        onSetDefaultAction={canManage ? state.setDefault : undefined}
      />

      {state.canVerify ? (
        <VerifyBankTransferButtons
          methods={methods}
          verifying={state.verifying}
          onVerify={state.verify}
          t={t}
          tType={state.tType}
        />
      ) : null}

      <PaymentMethodFormDialogWrapped
        formOpen={state.formOpen}
        targetUserId={targetUserId}
        slotDirection={state.slotDirection}
        allowedDirections={state.allowedDirections}
        editMethod={state.editMethod}
        labels={state.labels}
        setFormOpen={state.setFormOpen}
        setEditMethod={state.setEditMethod}
        onSaved={refetchData}
      />

      <PaymentMethodDeleteDialog
        open={state.deleteId != null}
        methodLabel={state.deleteLabel}
        isLoading={state.deleting}
        labels={state.labels.manager}
        onClose={() => state.setDeleteId(null)}
        onConfirm={state.handleConfirmDelete}
      />
    </Stack>
  );
}
