"use client";

import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { Button } from "@mui/material";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import {
  type PaymentDirection,
  PaymentMethodType,
  type UserPaymentMethodFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { PaymentMethodFormDialog } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodFormDialog";
import { resolveTypeLabel } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsManager.helpers";
import type { PaymentMethodProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/types/paymentMethodProfile.types";
import type { PaymentMethodLabels, PaymentMethodManagerLabels } from "@/shared/locale/types/ui";

type VerifyButtonProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly verifying: boolean;
  readonly onVerify: (id: string) => Promise<void>;
  readonly t: PaymentMethodManagerLabels;
  readonly tType: PaymentMethodLabels;
};

export function VerifyBankTransferButtons({ methods, verifying, onVerify, t, tType }: VerifyButtonProps) {
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
  readonly labels: PaymentMethodProfileLabels;
  readonly setFormOpen: (open: boolean) => void;
  readonly setEditMethod: (method: UserPaymentMethodFieldsFragment | null) => void;
  readonly onSaved: () => Promise<void>;
};

export function PaymentMethodFormDialogWrapped({
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
