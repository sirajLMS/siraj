"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/meetingConfigsTabTypes";
import { useAppTranslation } from "@/shared/locale";

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
  const t = useAppTranslation().uiTranslations.meetingConfig;
  const { hasPermission } = useUserStore();

  const canManage =
    scope === ProfileScope.Own
      ? hasPermission(AppPermission.MeetingConfigsManageOwn)
      : hasPermission(AppPermission.MeetingConfigsManageOther);

  const viewModel: MeetingConfigsTabViewModel = {
    targetUserId,
    canManage,
    sectionTitle: t.sectionTitle,
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
