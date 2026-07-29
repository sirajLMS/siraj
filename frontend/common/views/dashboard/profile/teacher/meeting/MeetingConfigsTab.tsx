"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/meetingConfigsTabTypes";
import { useMeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/useMeetingConfigsTabViewModel";

type MeetingConfigsTabProps = {
  readonly targetUserId: string;
  readonly scope: ProfileScope;
};

const lazyViews = createLazyView<MeetingConfigsTabViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/teacher/meeting/meetingConfigsTab.mobile").then(m => ({
      default: m.MeetingConfigsTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/teacher/meeting/meetingConfigsTab.desktop").then(m => ({
      default: m.MeetingConfigsTabDesktopView,
    }))
);

export function MeetingConfigsTab({ targetUserId, scope }: Readonly<MeetingConfigsTabProps>) {
  const viewModel = useMeetingConfigsTabViewModel({ targetUserId, scope });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
