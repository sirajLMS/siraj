"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { JumpToDateHeaderProps } from "@/frontend/views/dashboard/teachers/futureSchedule/types";

const lazyViews = createLazyView<JumpToDateHeaderProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.mobile").then(m => ({
      default: m.JumpToDateHeaderMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.desktop").then(
      m => ({
        default: m.JumpToDateHeaderDesktop,
      })
    )
);

export function JumpToDateHeader(props: Readonly<JumpToDateHeaderProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
