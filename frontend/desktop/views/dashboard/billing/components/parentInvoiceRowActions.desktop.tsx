"use client";

import { ParentInvoiceRowActionsShared } from "@/frontend/common/views/dashboard/billing/components/__shared__/parentInvoiceRowActionsShared";
import type { ParentInvoiceRowActionsProps } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";

export function ParentInvoiceRowActionsDesktop(props: Readonly<ParentInvoiceRowActionsProps>): React.ReactNode {
  return ParentInvoiceRowActionsShared(props, {
    PrimaryAction: DesktopPrimaryPageAction,
    paymentPendingSize: "small",
    paymentPendingFullWidth: false,
    paymentPendingWrapInBox: true,
    unpaidLayout: "row",
    unpaidViewFeedbackSize: "small",
    unpaidViewFeedbackFullWidth: false,
    unpaidPrimarySize: "small",
    unpaidPrimaryFullWidth: false,
  });
}
