"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { SubjectsViewProps } from "@/frontend/views/dashboard/subjects/home/types";

const lazyViews = createLazyView<SubjectsViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/subjects/home/subjectsView.mobile").then(m => ({
      default: m.SubjectsViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/subjects/home/subjectsView.desktop").then(m => ({
      default: m.SubjectsViewDesktop,
    }))
);

export function SubjectsView(props: Readonly<SubjectsViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
