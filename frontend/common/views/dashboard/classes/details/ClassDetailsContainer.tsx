"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ClassDetailsViewModel,
  useClassDetailsViewModel,
} from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";

const lazyViews = createLazyView<{ readonly viewModel: ClassDetailsViewModel }>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/details/classDetailsContainer.mobile").then(m => ({
      default: m.ClassDetailsContainerMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/details/classDetailsContainer.desktop").then(m => ({
      default: m.ClassDetailsContainerDesktop,
    }))
);

export function ClassDetailsContainer() {
  const viewModel = useClassDetailsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={{ viewModel }} />;
}
