"use client";

import { PaymentsLedgerView } from "@/frontend/common/views/dashboard/billing/PaymentsLedgerView";
import type { UsePaymentsLedgerViewModelProps } from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel";

/**
 * Server-component entry for `/parent/payments`: the page gates and renders
 * this container with no props; the tiered view resolves the ViewModel itself.
 */
export function PaymentsLedgerContainer(_props: Readonly<UsePaymentsLedgerViewModelProps> = {}) {
  return <PaymentsLedgerView />;
}
