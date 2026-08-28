"use client";

import { MeetingConfigsManager } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs";
import type { MeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/meetingConfigsTabTypes";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function MeetingConfigsTabDesktopView({
  targetUserId,
  canManage,
  sectionTitle,
}: Readonly<MeetingConfigsTabViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={sectionTitle} />
      <DesktopSectionPanel>
        <MeetingConfigsManager targetUserId={targetUserId} canManage={canManage} />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
