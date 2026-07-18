"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ManualInvoiceView } from "@/frontend/common/views/dashboard/billing/manual/ManualInvoiceView";
import type { UseManualInvoiceViewModelProps } from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel";

// NEW FOR PLAN v5 (manual-invoice wave): Container now accepts no props per
// the §6.1 Server-Component contract — it renders the View, which invokes
// the ViewModel internally.
export function ManualInvoiceContainer(_props: Readonly<UseManualInvoiceViewModelProps> = {}) {
  return (
    <RequirePermission permissions={[AppPermission.BillingCreateInvoice]} fallback={null}>
      <ManualInvoiceView />
    </RequirePermission>
  );
}
