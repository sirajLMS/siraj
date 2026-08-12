"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import { ManualInvoiceSupportCardsShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceSupportCardsShared";
import type { ManualInvoiceSupportCardsProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceSupportCards.types";

export function ManualInvoiceSupportCardsDesktop(props: Readonly<ManualInvoiceSupportCardsProps>) {
  return <ManualInvoiceSupportCardsShared {...props} config={{ Card: BaseCard }} />;
}
