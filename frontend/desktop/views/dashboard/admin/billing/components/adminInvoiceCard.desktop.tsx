"use client";

import { AdminInvoiceCardShared } from "@/frontend/common/views/dashboard/admin/billing/components/adminInvoiceCardShared";
import type {
  AdminInvoiceCardProps,
  AdminInvoiceCardSlotProps,
} from "@/frontend/common/views/dashboard/admin/billing/components/types/adminInvoiceCard.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLink.desktop";

export type AdminInvoiceDesktopCardProps = AdminInvoiceCardProps;

const slots: AdminInvoiceCardSlotProps = {
  StatusBadge: DesktopStatusBadge,
  PersonProfileLink: DesktopPersonProfileLink,
};

export function AdminInvoiceDesktopCard(props: Readonly<AdminInvoiceDesktopCardProps>) {
  return <AdminInvoiceCardShared props={props} slots={slots} />;
}
