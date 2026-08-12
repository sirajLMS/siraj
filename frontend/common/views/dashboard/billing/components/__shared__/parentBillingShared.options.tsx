import type { ParentBillingSharedOptions } from "@/frontend/common/views/dashboard/billing/components/__shared__/parentBillingShared";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { BillingSectionDesktop } from "@/frontend/desktop/views/dashboard/billing/components/__shared__/billingSectionShared.desktop";
import { BillingSectionMobile } from "@/frontend/mobile/views/dashboard/billing/components/__shared__/billingSectionShared.mobile";

export const DESKTOP_OPTIONS: ParentBillingSharedOptions = {
  wrapperBox: true,
  renderBillingSection: vm => <BillingSectionDesktop {...vm} />,
};

export const MOBILE_OPTIONS: ParentBillingSharedOptions = {
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
