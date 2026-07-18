"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  ParentsViewModel,
  UseParentsViewModelProps,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { useParentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/home/useParentsViewModel";

const lazyViews = createLazyView<ParentsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/parents/home/parentsView.mobile").then(m => ({
      default: m.ParentsViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/parents/home/parentsView.desktop").then(m => ({
      default: m.ParentsViewDesktop,
    }))
);

export function ParentsView(props: Readonly<UseParentsViewModelProps>) {
  const viewModel = useParentsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { ParentsViewModel, UseParentsViewModelProps };
