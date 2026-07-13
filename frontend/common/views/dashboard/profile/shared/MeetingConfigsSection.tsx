"use client";

import { SectionPanel } from "@/frontend/common/components/ui";
import { MeetingConfigsManager } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager";

export type MeetingConfigsSectionProps = {
  readonly userId: string;
  readonly canManage?: boolean;
};

export function MeetingConfigsSection({ userId, canManage = true }: MeetingConfigsSectionProps) {
  return (
    <SectionPanel>
      <MeetingConfigsManager targetUserId={userId} canManage={canManage} />
    </SectionPanel>
  );
}
