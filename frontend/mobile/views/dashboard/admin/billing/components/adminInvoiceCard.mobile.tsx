"use client";

import { AdminInvoiceCardShared } from "@/frontend/common/views/dashboard/admin/billing/components/adminInvoiceCardShared";
import type {
  AdminInvoiceCardProps,
  AdminInvoiceCardSlotProps,
} from "@/frontend/common/views/dashboard/admin/billing/components/types/adminInvoiceCard.types";
import { MobilePrimaryPageAction, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

const slots: AdminInvoiceCardSlotProps = {
  StatusBadge: MobileStatusBadge,
  PersonProfileLink: MobilePersonProfileLink,
  ActionButton: MobilePrimaryPageAction,
};

export function AdminInvoiceMobileCard(props: Readonly<AdminInvoiceCardProps>) {
  return <AdminInvoiceCardShared props={props} slots={slots} />;
}
