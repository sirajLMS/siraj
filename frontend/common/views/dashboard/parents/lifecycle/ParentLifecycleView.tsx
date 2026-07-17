"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";

const lazyViews = createLazyView<ParentLifecycleViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/parents/lifecycle/parentLifecycle.mobile").then(m => ({
      default: m.ParentLifecycleMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parents/lifecycle/parentLifecycle.desktop").then(m => ({
      default: m.ParentLifecycleDesktopView,
    }))
);

export function ParentLifecycleView(props: Readonly<ParentLifecycleViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
