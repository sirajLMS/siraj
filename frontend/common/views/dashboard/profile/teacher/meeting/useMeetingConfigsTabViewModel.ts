"use client";

import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/meetingConfigsTabTypes";
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
    scope === ProfileScope.Own
      ? hasPermission(AppPermission.MeetingConfigsManageOwn)
      : hasPermission(AppPermission.MeetingConfigsManageOther);

  return {
    targetUserId,
    canManage,
    sectionTitle: t.sectionTitle,
  };
}
