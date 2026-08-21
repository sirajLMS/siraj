"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/meetingConfigsTabTypes";
import { ProfileScope } from "@/shared/constants/profile.enum";
import { Translation, useAppTranslation } from "@/shared/locale";

export type UseMeetingConfigsTabViewModelProps = {
  readonly targetUserId: string;
  readonly scope: ProfileScope;
};

export function useMeetingConfigsTabViewModel(
  props: Readonly<UseMeetingConfigsTabViewModelProps>
): MeetingConfigsTabViewModel {
  const { targetUserId, scope } = props;
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const { hasPermission } = useUserStore();

  const canManage =
    scope === ProfileScope.OWN
      ? hasPermission(AppPermission.MeetingConfigsManageOwn)
      : hasPermission(AppPermission.MeetingConfigsManageOther);

  return {
    targetUserId,
    canManage,
    sectionTitle: t.sectionTitle,
  };
}
