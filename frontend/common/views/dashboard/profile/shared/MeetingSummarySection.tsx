"use client";

import { Box, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { MeetingConfigDisplay } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplay";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { useMeetingSummarySectionViewModel } from "@/frontend/common/views/dashboard/profile/shared/useMeetingSummarySectionViewModel";

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
  const { labels, loading, defaultConfig } = useMeetingSummarySectionViewModel({ userId });
  const t = labels.summary;

  const renderConfigContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
          <CircularProgress size={18} />
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.onSurfaceVariant })}>
            {t.loading}
          </Typography>
        </Box>
      );
    }

    if (defaultConfig) {
      return <MeetingConfigDisplay config={toDisplayData(defaultConfig)} compact />;
    }

    return (
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.onSurfaceVariant })}>{t.empty}</Typography>
    );
  };

  return (
    <SectionPanel title={t.sectionTitle}>
      <Stack spacing={1.5}>
        {renderConfigContent()}
        {meetingTabHref ? (
          <Link href={meetingTabHref} underline="hover" sx={{ typography: "labelMd" }}>
            {t.manageLink}
          </Link>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
