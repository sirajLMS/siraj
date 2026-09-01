"use client";

import type { ReactNode } from "react";
import {
  ParentBillingShared,
  type ParentBillingSharedOptions,
} from "@/frontend/common/views/dashboard/billing/components/__shared__/parentBillingShared";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { BillingSectionMobile } from "@/frontend/mobile/views/dashboard/billing/components/__shared__/billingSectionShared.mobile";

const MOBILE_OPTIONS: ParentBillingSharedOptions = {
  wrapperBox: false,
  renderBillingSection: vm => {
    const parentMetrics = buildParentMetrics(vm.summary, vm.labels);
    return (
      <BillingSectionMobile
        {...vm}
        pageTitle={vm.labels.parentPageTitle}
        pageSubtitle={vm.labels.parentPageSubtitle}
        metrics={parentMetrics}
      />
    );
  },
};

export function ParentBillingMobileView({ ...vm }: Readonly<ParentBillingViewModel>): ReactNode {
  return <ParentBillingShared {...vm} options={MOBILE_OPTIONS} />;
}
