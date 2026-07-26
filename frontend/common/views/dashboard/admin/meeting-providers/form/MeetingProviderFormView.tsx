"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { MeetingProviderFormViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";

const lazyViews = createLazyView<MeetingProviderFormViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/meeting-providers/form/meetingProviderForm.mobile").then(m => ({
      default: m.MeetingProviderFormMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/meeting-providers/form/meetingProviderForm.desktop").then(m => ({
      default: m.MeetingProviderFormDesktopView,
    }))
);

export function MeetingProviderFormView(props: Readonly<MeetingProviderFormViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
