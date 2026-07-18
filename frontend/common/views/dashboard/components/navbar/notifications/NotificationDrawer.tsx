"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { NotificationDrawerProps } from "@/frontend/common/views/dashboard/components/navbar/notifications/types";

const lazyViews = createLazyView<NotificationDrawerProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/components/navbar/notifications/notificationDrawer.mobile").then(m => ({
      default: m.NotificationDrawerMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/components/navbar/notifications/notificationDrawer.desktop").then(m => ({
      default: m.NotificationDrawerDesktop,
    }))
);

export function NotificationDrawer(props: Readonly<NotificationDrawerProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
