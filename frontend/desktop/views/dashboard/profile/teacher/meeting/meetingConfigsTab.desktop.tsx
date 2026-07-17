"use client";

import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { MeetingConfigsManager } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs";
import type { MeetingConfigsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/meeting/meetingConfigsTabTypes";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

export function MeetingConfigsTabDesktopView({
  targetUserId,
  canManage,
  sectionTitle,
}: Readonly<MeetingConfigsTabViewModel>) {
  return (
    <DesktopPageContainer>
      <Stack spacing={3}>
        <DesktopPageHeader title={sectionTitle} />
        <SectionPanel>
          <MeetingConfigsManager targetUserId={targetUserId} canManage={canManage} />
        </SectionPanel>
      </Stack>
    </DesktopPageContainer>
  );
}
