"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { FeedbackManageTabsViewModel } from "@/frontend/common/views/dashboard/feedback/tabs/useFeedbackManageTabsViewModel";

const lazyChrome = createLazyView<FeedbackManageTabsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/feedback/feedbackManage.mobile").then(m => ({
      default: m.FeedbackManageMobileChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/feedback/feedbackManage.desktop").then(m => ({
      default: m.FeedbackManageDesktopChrome,
    }))
);

export function FeedbackManagePageChrome(viewModel: Readonly<FeedbackManageTabsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
