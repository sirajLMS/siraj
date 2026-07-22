import { PersonSearchOutlined, PublicOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { AvatarGroup, Box, Tooltip, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import { AvailabilityInsightsLayout } from "@/frontend/common/views/dashboard/teachers/availability/components/availabilityInsightsLayout";
import type {
  AvailabilityInsightsProps,
  InsightCardProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";
import { DesktopTimezoneDisplay } from "@/frontend/desktop/components/ui/display";
import { useAppTranslation } from "@/shared/locale";

function InsightCard({ title, value, description, icon }: Readonly<InsightCardProps>) {
  return (
    <BaseCard
      sx={theme => ({
        p: theme.layout.cardPadding,
        display: "flex",
        flexDirection: "column",
        minHeight: 160,
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {title}
        </Typography>
        {icon}
      </Box>
      <Box sx={{ mt: "auto" }}>
        <Typography variant="display" sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
          {value}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
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
        minHeight: 160,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography variant="titleLg" sx={theme => ({ mb: 1, color: theme.palette.primary.main })}>
          {labels.title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.description}
        </Typography>
      </Box>

      <AvatarGroup
        max={4}
        sx={theme => ({
          mt: 2,
          justifyContent: "flex-end",
          flexDirection: "row-reverse",
          position: "relative",
          zIndex: 1,
          "& .MuiAvatar-root": {
            width: 32,
            height: 32,
            fontSize: theme.typography.labelSm.fontSize,
            fontWeight: 700,
            border: `2px solid ${theme.palette.background.paper}`,
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
          },
        })}
      >
        {timezones.map((tz, index) => (
          <Tooltip key={tz} title={<DesktopTimezoneDisplay timezone={tz} />} arrow describeChild>
            <DesktopUserAvatar
              size={32}
              sx={theme => ({
                backgroundColor: index === 0 ? theme.palette.primaryContainer : theme.palette.secondaryContainer,
                color: index === 0 ? theme.palette.onPrimaryContainer : theme.palette.onSecondaryContainer,
              })}
            >
              {tz}
            </DesktopUserAvatar>
          </Tooltip>
        ))}
      </AvatarGroup>

      <Box
        sx={{
          position: "absolute",
          right: -16,
          bottom: -16,
          opacity: 0.1,
          pointerEvents: "none",
        }}
      >
        <PublicOutlined sx={theme => ({ fontSize: 120, color: theme.palette.primary.main })} />
      </Box>
    </BaseCard>
  );
}

export function AvailabilityInsightsDesktop({ insights }: Readonly<AvailabilityInsightsProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherAvailability.insights;

  return (
    <AvailabilityInsightsLayout
      insights={insights}
      layoutSx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        gap: 3,
        mt: 4,
      }}
      peakLoadCard={
        <InsightCard
          title={t.peakLoad}
          value={insights.peakLoad}
          description={t.peakLoadDesc}
          icon={<TrendingUpOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
        />
      }
      availableStaffCard={
        <InsightCard
          title={t.availableStaff}
          value={t.teachersCount(insights.availableStaff)}
          description={t.availableStaffDesc}
          icon={<PersonSearchOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
        />
      }
      timezoneInsightCard={
        <TimezoneInsight
          timezones={insights.timezones}
          labels={{
            title: t.localTimezones,
            description: t.localTimezonesDesc,
          }}
        />
      }
    />
  );
}
