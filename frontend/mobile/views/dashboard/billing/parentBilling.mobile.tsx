"use client";

import type { ReactNode } from "react";
import { ParentBillingShared } from "@/frontend/common/views/dashboard/billing/components/__shared__/parentBillingShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/billing/components/__shared__/parentBillingShared.options";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";

export function ParentBillingMobileView({ ...vm }: Readonly<ParentBillingViewModel>): ReactNode {
  return <ParentBillingShared {...vm} options={MOBILE_OPTIONS} />;
}
