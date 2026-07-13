import { BILLING_INVOICE_POLL_INTERVAL_MS } from "@/shared/constants/billing/polling";

/** Returns 0 while billing dialogs are open to avoid mid-action background refetches. */
export function useBillingPollInterval(pause: boolean): number {
  return pause ? 0 : BILLING_INVOICE_POLL_INTERVAL_MS;
}
