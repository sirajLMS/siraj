"use client";

import { MeetingConfigsManager } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs";
import type { MeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/meetingConfigsTabTypes";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function MeetingConfigsTabMobileView({
  targetUserId,
  canManage,
  sectionTitle,
}: Readonly<MeetingConfigsTabViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={sectionTitle} edgeToEdge={false} />
      <MeetingConfigsManager targetUserId={targetUserId} canManage={canManage} fullScreenFormDialog />
    </MobilePageContainer>
  );
}
