"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ResourcesViewModel,
  type UseResourcesViewModelProps,
  useResourcesViewModel,
} from "@/frontend/views/dashboard/resources/useResourcesViewModel";

export type { ResourcesViewModel };

const lazyViews = createLazyView<ResourcesViewModel>(
  () =>
    import("@/frontend/views/dashboard/resources/mobile/resources.mobile").then(m => ({
      default: m.ResourcesMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/resources/desktop/resources.desktop").then(m => ({
      default: m.ResourcesDesktopView,
    }))
);

export function ResourcesView(props: Readonly<UseResourcesViewModelProps>) {
  const viewModel = useResourcesViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
