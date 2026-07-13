"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { FutureClassCardProps } from "@/frontend/views/dashboard/teachers/futureSchedule/types";

const lazyViews = createLazyView<FutureClassCardProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/futureClassCard.mobile").then(m => ({
      default: m.FutureClassCardMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/teachers/futureSchedule/components/futureClassCard.desktop").then(m => ({
      default: m.FutureClassCardDesktop,
    }))
);

export function FutureClassCard(props: Readonly<FutureClassCardProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
