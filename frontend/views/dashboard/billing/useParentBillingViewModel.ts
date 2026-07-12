"use client";

import type { ParentBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";

export type ParentBillingViewModel = ParentBillingViewProps;

export type UseParentBillingViewModelProps = ParentBillingViewProps;

export function useParentBillingViewModel(props: Readonly<UseParentBillingViewModelProps>): ParentBillingViewModel {
  return { ...props };
}
