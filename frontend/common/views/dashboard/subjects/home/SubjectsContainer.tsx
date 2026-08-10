"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type SubjectsViewModel,
  useSubjectsViewModel,
} from "@/frontend/common/views/dashboard/subjects/home/useSubjectsViewModel";

const lazyViews = createLazyView<SubjectsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/subjects/home/subjectsView.mobile").then(m => ({
      default: m.SubjectsViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/subjects/home/subjectsView.desktop").then(m => ({
      default: m.SubjectsViewDesktop,
    }))
);

export function SubjectsContainer() {
  const viewModel = useSubjectsViewModel({});

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
