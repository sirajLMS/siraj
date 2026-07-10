"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/components/ui";
import { MeetingConfigDisplay } from "@/frontend/components/ui/display/meetingConfig/MeetingConfigDisplay";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { userMeetingConfigsQueryDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";

export type MeetingSummarySectionProps = {
  readonly userId: string;
  readonly meetingTabHref?: string;
};

function toDisplayData(config: UserMeetingConfigFieldsFragment) {
  return {
    id: config.id ?? undefined,
    label: config.label,
    isDefault: config.isDefault ?? false,
    providerSlug: config.provider?.slug,
    providerName: config.provider?.name ?? null,
    logoUrl: config.provider?.logoUrl,
    details: config.details,
  };
}

export function MeetingSummarySection({ userId, meetingTabHref }: MeetingSummarySectionProps) {
  const t = useTranslations("ui.meetingConfig.summary");
  const { data, loading } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId },
  });

  const configs = data?.userMeetingConfigs ?? [];
  const defaultConfig = configs.find(config => config.isDefault) ?? (configs.length === 1 ? configs[0] : null);

  return (
    <SectionPanel title={t("sectionTitle")}>
      <Stack spacing={1.5}>
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
            <CircularProgress size={18} />
            <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{t("loading")}</Typography>
          </Box>
        ) : defaultConfig ? (
          <MeetingConfigDisplay config={toDisplayData(defaultConfig as UserMeetingConfigFieldsFragment)} compact />
        ) : (
          <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{t("empty")}</Typography>
        )}
        {meetingTabHref ? (
          <Link href={meetingTabHref} underline="hover" sx={{ typography: "labelMd" }}>
            {t("manageLink")}
          </Link>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
