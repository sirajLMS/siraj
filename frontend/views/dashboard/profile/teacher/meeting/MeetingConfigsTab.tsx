"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { MeetingConfigsSection } from "@/frontend/views/dashboard/profile/shared/MeetingConfigsSection";

type MeetingConfigsTabProps = {
  readonly targetUserId: string;
};

export function MeetingConfigsTab({ targetUserId }: MeetingConfigsTabProps) {
  const t = useTranslations("ui.meetingConfig");

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={t("sectionTitle")} />
        <MeetingConfigsSection userId={targetUserId} />
      </Stack>
    </PageContainer>
  );
}
