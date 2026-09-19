"use client";

import { Chip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import { Translation } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale/client";
import type { PaymentMethodTypeLabels } from "@/shared/locale/types/ui";

const PAYMENT_METHOD_COLORS: Record<PaymentMethodType, (theme: Theme) => { backgroundColor: string; color: string }> = {
  [PaymentMethodType.MobileWallet]: theme => ({
    backgroundColor: theme.palette.status.activeContainer,
    color: theme.palette.status.onActiveContainer,
  }),
  [PaymentMethodType.PaymentLink]: theme => ({
    backgroundColor: theme.palette.status.confirmedContainer,
    color: theme.palette.status.onConfirmedContainer,
  }),
  [PaymentMethodType.OnlineAccount]: theme => ({
    backgroundColor: theme.palette.status.pendingContainer,
    color: theme.palette.status.onPendingContainer,
  }),
  [PaymentMethodType.BankTransfer]: theme => ({
    backgroundColor: theme.palette.status.completedContainer,
    color: theme.palette.status.onCompletedContainer,
  }),
  [PaymentMethodType.Cash]: theme => ({
    backgroundColor: theme.palette.status.activeContainer,
    color: theme.palette.status.onActiveContainer,
  }),
  [PaymentMethodType.ProofUpload]: theme => ({
    backgroundColor: theme.palette.status.pendingContainer,
    color: theme.palette.status.onPendingContainer,
  }),
};

/**
 * Bridges the payment-method locale's camelCase type keys onto the generated
 * `PaymentMethodType` enum so the chip needs no per-view status mapping.
 */
function buildPaymentMethodTypeLabels(type: PaymentMethodTypeLabels): Record<PaymentMethodType, string> {
  return {
    [PaymentMethodType.MobileWallet]: type.mobileWallet,
    [PaymentMethodType.PaymentLink]: type.paymentLink,
    [PaymentMethodType.OnlineAccount]: type.onlineAccount,
    [PaymentMethodType.BankTransfer]: type.bankTransfer,
    [PaymentMethodType.Cash]: type.cash,
    [PaymentMethodType.ProofUpload]: type.proofUpload,
  };
}

export interface PaymentMethodChipProps {
  /** Payment method type of the income payment row; drives chip color and label. */
  readonly paymentMethodType: PaymentMethodType;
}

/**
 * Small chip for an income payment's method (mobile wallet, bank transfer,
 * cash, …) on the P&L Income Payments tab. Label copy reuses the shared
 * `ui.paymentMethod` type catalog so method names stay consistent with the
 * rest of the billing UI; colors resolve through `theme.palette.status`.
 */
export function PaymentMethodChip({ paymentMethodType }: Readonly<PaymentMethodChipProps>) {
  const paymentMethodLabels = useAppTranslation(Translation.Ui.PaymentMethod);
  const typeLabels = buildPaymentMethodTypeLabels(paymentMethodLabels.type);
  const label = typeLabels[paymentMethodType];

  return (
    <Chip size="small" label={label} aria-label={label} sx={theme => PAYMENT_METHOD_COLORS[paymentMethodType](theme)} />
  );
}
