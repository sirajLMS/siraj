"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { Button, Stack } from "@mui/material";
import { ErrorState, PrimaryPageAction } from "@/frontend/common/components/ui";
import { PaymentMethodList } from "@/frontend/common/components/ui/display/paymentMethod/PaymentMethodList";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import {
  type PaymentDirection,
  PaymentMethodType,
  type UserPaymentMethodFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { PaymentMethodDeleteDialog } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodDeleteDialog";
import { PaymentMethodFormDialog } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodFormDialog";
import { usePaymentMethodsManagerViewModel } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodsManagerViewModel";
import type {
  PaymentMethodLabels,
  PaymentMethodManagerLabels,
  PaymentMethodTypeLabels,
} from "@/shared/locale/types/ui";

function isPaymentMethodTypeLabelKey(key: string): key is keyof PaymentMethodTypeLabels {
  return (
    key === "mobileWallet" ||
    key === "paymentLink" ||
    key === "onlineAccount" ||
    key === "bankTransfer" ||
    key === "cash" ||
    key === "proofUpload"
  );
}

function resolveTypeLabel(messageKey: string, typeLabels: PaymentMethodTypeLabels): string {
  const stripped = messageKey.startsWith("type.") ? messageKey.slice(5) : messageKey;
  if (isPaymentMethodTypeLabelKey(stripped)) {
    return typeLabels[stripped];
  }
  return "";
}

export type PaymentMethodsSlot = "payin" | "payout";

export type PaymentMethodsManagerProps = {
  readonly targetUserId: string;
  readonly slot: PaymentMethodsSlot;
  readonly canManage: boolean;
};

type VerifyButtonProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly verifying: boolean;
  readonly onVerify: (id: string) => Promise<void>;
  readonly t: PaymentMethodManagerLabels;
  readonly tType: PaymentMethodLabels;
};

function VerifyBankTransferButtons({ methods, verifying, onVerify, t, tType }: VerifyButtonProps) {
  const verifyTargets = methods.filter(row => row.type === PaymentMethodType.BankTransfer && !row.verifiedAt);
  if (verifyTargets.length === 0) return null;

  return verifyTargets.map(row => (
    <Button
      key={`verify-${row.id}`}
      variant="outlined"
      size="small"
      startIcon={<VerifiedOutlinedIcon />}
      disabled={verifying}
      onClick={async () => {
        await onVerify(row.id);
      }}
      sx={{ alignSelf: "flex-start" }}
    >
      {t.verify(row.label ?? getPaymentMethodTypeLabel(row.type, key => resolveTypeLabel(key, tType.type)))}
    </Button>
  ));
}

type PaymentMethodFormDialogWrappedProps = {
  readonly formOpen: boolean;
  readonly targetUserId: string;
  readonly slotDirection: PaymentDirection.Payin | PaymentDirection.Payout;
  readonly allowedDirections: readonly PaymentDirection[];
  readonly editMethod: UserPaymentMethodFieldsFragment | null;
  readonly labels: ReturnType<typeof usePaymentMethodsManagerViewModel>["labels"];
  readonly setFormOpen: (open: boolean) => void;
  readonly setEditMethod: (method: UserPaymentMethodFieldsFragment | null) => void;
  readonly onSaved: () => Promise<void>;
};

function PaymentMethodFormDialogWrapped({
  formOpen,
  targetUserId,
  slotDirection,
  allowedDirections,
  editMethod,
  labels,
  setFormOpen,
  setEditMethod,
  onSaved,
}: PaymentMethodFormDialogWrappedProps) {
  return (
    <PaymentMethodFormDialog
      open={formOpen}
      userId={targetUserId}
      slotDirection={slotDirection}
      allowedDirections={allowedDirections}
      editMethod={editMethod}
      labels={labels}
      onClose={() => {
        setFormOpen(false);
        setEditMethod(null);
      }}
      onSaved={onSaved}
    />
  );
}

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

export function PaymentMethodsManager({ targetUserId, slot, canManage }: PaymentMethodsManagerProps) {
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

      <PaymentMethodList
        methods={methods}
        loading={busy}
        title={t.listTitle}
        emptyMessage={t.empty}
        onEditAction={state.handleEdit}
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
