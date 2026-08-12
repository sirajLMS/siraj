"use client";

import type { ReactNode } from "react";
import { ParentBillingShared } from "@/frontend/common/views/dashboard/billing/components/__shared__/parentBillingShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/billing/components/__shared__/parentBillingShared.options";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";

export function ParentBillingDesktopView({ ...vm }: Readonly<ParentBillingViewModel>): ReactNode {
  return <ParentBillingShared {...vm} options={DESKTOP_OPTIONS} />;
}
