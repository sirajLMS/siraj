// NEW FOR PLAN v5 (lifted from inline tier declarations in paymentMethodTypeSelector.{mobile,desktop}.tsx
// and PaymentMethodTypeSelector.tsx so both tiers and the common wrapper share one pure-data
// constant-map builder per specs.md §5 (byte-identical twin modules) and §3 N5 (Record<E,K> > 5
// entries must not be inline in tier).

import type { PaymentMethodTypeSelectorLabels } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";

const PROOF_UPLOAD_FALLBACK_LABEL = "Proof upload";

export function buildPaymentMethodTypeLabelByType(
  labels: Partial<PaymentMethodTypeSelectorLabels> | undefined,
  t: PaymentMethodTypeSelectorLabels
): Record<PaymentMethodType, string> {
  return {
    [PaymentMethodType.MobileWallet]: labels?.mobileWallet ?? t.mobileWallet,
    [PaymentMethodType.PaymentLink]: labels?.paymentLink ?? t.paymentLink,
    [PaymentMethodType.OnlineAccount]: labels?.onlineAccount ?? t.onlineAccount,
    [PaymentMethodType.BankTransfer]: labels?.bankTransfer ?? t.bankTransfer,
    [PaymentMethodType.Cash]: labels?.cash ?? t.cash,
    [PaymentMethodType.ProofUpload]: PROOF_UPLOAD_FALLBACK_LABEL,
  };
}
