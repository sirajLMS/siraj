"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { useUserStore } from "@/frontend/common/stores/userStore";

export interface BillingPermissions {
  readonly canManage: boolean;
  readonly canSubmitProof: boolean;
  readonly canView: boolean;
  readonly canCreate: boolean;
  readonly billingActionsDisabled: boolean;
}

export function useBillingPermissions(): BillingPermissions {
  const { isImpersonating } = useImpersonation();
  const hasPermission = useUserStore(state => state.hasPermission);
  return {
    canManage: hasPermission(AppPermission.BillingUpdateStatusPaid),
    canSubmitProof: hasPermission(AppPermission.BillingSubmitPaymentProof),
    canView: hasPermission(AppPermission.BillingViewHistory),
    canCreate: hasPermission(AppPermission.BillingCreateInvoice),
    billingActionsDisabled: isImpersonating,
  };
}
