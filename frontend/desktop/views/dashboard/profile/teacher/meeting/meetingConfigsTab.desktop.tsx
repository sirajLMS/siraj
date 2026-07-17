"use client";

import { Stack } from "@mui/material";
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
      <Stack spacing={3}>
        <DesktopPageHeader title={sectionTitle} />
        <DesktopSectionPanel>
          <MeetingConfigsManager targetUserId={targetUserId} canManage={canManage} />
        </DesktopSectionPanel>
      </Stack>
    </DesktopPageContainer>
  );
}
