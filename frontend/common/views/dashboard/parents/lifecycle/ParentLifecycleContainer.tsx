"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentLifecycleViewModel,
  type UseParentLifecycleViewModelProps,
  useParentLifecycleViewModel,
} from "@/frontend/common/views/dashboard/parents/lifecycle/useParentLifecycleViewModel";

export type { ParentLifecycleViewModel, UseParentLifecycleViewModelProps };

const lazyViews = createLazyView<ParentLifecycleViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/parents/lifecycle/parentLifecycle.mobile").then(m => ({
      default: m.ParentLifecycleMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parents/lifecycle/parentLifecycle.desktop").then(m => ({
      default: m.ParentLifecycleDesktopView,
    }))
);

export function ParentLifecycleContainer(props: Readonly<UseParentLifecycleViewModelProps>) {
  const viewModel = useParentLifecycleViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
