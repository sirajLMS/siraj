"use client";

import type { ReactNode } from "react";
import {
  ParentBillingShared,
  type ParentBillingSharedOptions,
} from "@/frontend/common/views/dashboard/billing/components/__shared__/parentBillingShared";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";
import { BillingSectionDesktop } from "@/frontend/desktop/views/dashboard/billing/components/__shared__/billingSectionShared.desktop";

const DESKTOP_OPTIONS: ParentBillingSharedOptions = {
  wrapperBox: true,
  renderBillingSection: vm => <BillingSectionDesktop {...vm} />,
};

export function ParentBillingDesktopView({ ...vm }: Readonly<ParentBillingViewModel>): ReactNode {
  return <ParentBillingShared {...vm} options={DESKTOP_OPTIONS} />;
}
