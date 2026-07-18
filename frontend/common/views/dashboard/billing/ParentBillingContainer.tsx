"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentBillingView } from "@/frontend/common/views/dashboard/billing/ParentBillingView";
import type { UseParentBillingViewModelProps } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";

// NEW FOR PLAN v5 (parent-billing wave): Container now accepts no props per
// the §6.1 Server-Component contract — it simply renders the View, which
// invokes the ViewModel internally.
export function ParentBillingContainer(_props: Readonly<UseParentBillingViewModelProps> = {}) {
  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]} fallback={null}>
      <ParentBillingView />
    </RequirePermission>
  );
}
