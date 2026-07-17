"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ResourcesViewModel,
  type UseResourcesViewModelProps,
  useResourcesViewModel,
} from "@/frontend/common/views/dashboard/resources/useResourcesViewModel";

const lazyViews = createLazyView<ResourcesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/resources/resources.mobile").then(m => ({
      default: m.ResourcesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/resources/resources.desktop").then(m => ({
      default: m.ResourcesDesktopView,
    }))
);

export function ResourcesView(props: Readonly<UseResourcesViewModelProps>) {
  const viewModel = useResourcesViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { ResourcesViewModel, UseResourcesViewModelProps };
