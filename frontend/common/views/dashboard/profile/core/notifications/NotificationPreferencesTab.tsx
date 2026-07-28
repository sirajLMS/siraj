"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { useNotificationPreferencesTabViewModel } from "@/frontend/common/views/dashboard/profile/core/notifications/useNotificationPreferencesTabViewModel";

type NotificationPreferencesTabProps = {
  readonly isActive: boolean;
};

const lazyViews = createLazyView<NotificationPreferencesTabVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/core/notifications/notificationPreferencesTab.mobile").then(
      m => ({
        default: m.NotificationPreferencesTabMobile,
      })
    ),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/core/notifications/notificationPreferencesTab.desktop").then(
      m => ({ default: m.NotificationPreferencesTabDesktop })
    )
);

export function NotificationPreferencesTab({ isActive }: Readonly<NotificationPreferencesTabProps>) {
  const viewModel = useNotificationPreferencesTabViewModel({ isActive });

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
