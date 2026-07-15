"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { DateNavigatorProps } from "@/frontend/common/components/ui/filter/DateNavigator.types";
import { useViewport } from "@/frontend/common/hooks/useViewport";

const lazyViews = createLazyView<DateNavigatorProps>(
  () =>
    import("@/frontend/mobile/components/ui/filter/dateNavigator.mobile").then(m => ({
      default: m.DateNavigatorMobile,
    })),
  () =>
    import("@/frontend/desktop/components/ui/filter/dateNavigator.desktop").then(m => ({
      default: m.DateNavigatorDesktop,
    }))
);

export function DateNavigator(props: Readonly<DateNavigatorProps>) {
  useViewport();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
