// cspell:disable
"use client";

import { PersonSearchOutlined, PublicOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { AvatarGroup, Box, Tooltip, Typography } from "@mui/material";
import { UserAvatar } from "@/frontend/common/components/ui";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display";
import type {
  AvailabilityInsightsProps,
  InsightCardProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { useAppTranslation } from "@/shared/locale";

function InsightCard({ title, value, description, icon }: Readonly<InsightCardProps>) {
  return (
    <BaseCard
      sx={theme => ({
        p: theme.layout.cardPadding,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 130,
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {title}
        </Typography>
        {icon}
      </Box>
      <Box sx={{ mt: "auto" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
          {value}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {description}
        </Typography>
      </Box>
    </BaseCard>
  );
}

function TimezoneInsight({
  timezones,
  labels,
}: Readonly<{ timezones: readonly string[]; labels: { title: string; description: string } }>) {
  return (
    <BaseCard
      sx={theme => ({
        p: theme.layout.cardPadding,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 130,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography variant="titleLg" sx={theme => ({ mb: 0.5, color: theme.palette.primary.main })}>
          {labels.title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.description}
        </Typography>
      </Box>

      <AvatarGroup
        max={4}
        sx={theme => ({
          mt: 1.5,
          justifyContent: "flex-end",
          flexDirection: "row-reverse",
          position: "relative",
          zIndex: 1,
          "& .MuiAvatar-root": {
            width: 28,
            height: 28,
            fontSize: theme.typography.labelSm.fontSize,
            fontWeight: 700,
            border: `2px solid ${theme.palette.background.paper}`,
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
          },
        })}
      >
        {timezones.map((tz, index) => (
          <Tooltip key={tz} title={<TimezoneDisplay timezone={tz} />} arrow describeChild>
            <UserAvatar
              size={28}
              sx={theme => ({
                backgroundColor: index === 0 ? theme.palette.primaryContainer : theme.palette.secondaryContainer,
                color: index === 0 ? theme.palette.onPrimaryContainer : theme.palette.onSecondaryContainer,
              })}
            >
              {tz}
            </UserAvatar>
          </Tooltip>
        ))}
      </AvatarGroup>

      <Box
        sx={{
          position: "absolute",
          right: -12,
          bottom: -12,
          opacity: 0.1,
          pointerEvents: "none",
        }}
      >
        <PublicOutlined sx={theme => ({ fontSize: 96, color: theme.palette.primary.main })} />
      </Box>
    </BaseCard>
  );
}

export function AvailabilityInsightsMobile({ insights }: Readonly<AvailabilityInsightsProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherAvailability.insights;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 3,
      }}
    >
      <InsightCard
        title={t.peakLoad}
        value={insights.peakLoad}
        description={t.peakLoadDesc}
        icon={<TrendingUpOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
      />

      <InsightCard
        title={t.availableStaff}
        value={t.teachersCount(insights.availableStaff)}
        description={t.availableStaffDesc}
        icon={<PersonSearchOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
      />

      <TimezoneInsight
        timezones={insights.timezones}
        labels={{
          title: t.localTimezones,
          description: t.localTimezonesDesc,
        }}
      />
    </Box>
  );
}
