"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { MeetingConfigsManager } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs";

type MeetingConfigsTabProps = {
  readonly targetUserId: string;
  readonly scope: ProfileScope;
};

export function MeetingConfigsTab({ targetUserId, scope }: MeetingConfigsTabProps) {
  const t = useTranslations("ui.meetingConfig");
  const { hasPermission } = useUserStore();

  const canManage =
    scope === ProfileScope.Own
      ? hasPermission(AppPermission.MeetingConfigsManageOwn)
      : hasPermission(AppPermission.MeetingConfigsManageOther);

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={t("sectionTitle")} />
        <SectionPanel>
          <MeetingConfigsManager targetUserId={targetUserId} canManage={canManage} />
        </SectionPanel>
      </Stack>
    </PageContainer>
  );
}
