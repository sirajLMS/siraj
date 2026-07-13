"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/common/components/ui";
import { MeetingConfigDisplay } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplay";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { userMeetingConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

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
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.onSurfaceVariant })}>
              {t("loading")}
            </Typography>
          </Box>
        ) : defaultConfig ? (
          <MeetingConfigDisplay config={toDisplayData(defaultConfig as UserMeetingConfigFieldsFragment)} compact />
        ) : (
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.onSurfaceVariant })}>
            {t("empty")}
          </Typography>
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
