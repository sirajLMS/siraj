"use client";

import { PersonSearchOutlined, PublicOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { AvatarGroup, Box, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType, ReactNode } from "react";
import type { BaseAvatarVariant } from "@/frontend/common/components/ui/avatar/BaseAvatar";
import { toIanaTimezoneOrNull } from "@/frontend/common/lib/timezone";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { AvailabilityInsightsLayout } from "@/frontend/common/views/dashboard/teachers/availability/components/availabilityInsightsLayout";
import type {
  AvailabilityInsightsProps,
  InsightCardProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export interface AvailabilityInsightsSharedStyleOptions {
  readonly cardMinHeight: number;
  readonly cardFlex?: number;
  readonly insightTitleMarginBottom: number;
  readonly valueVariant: UiTypographyVariant;
  readonly descriptionVariant: UiTypographyVariant;
  readonly timezoneTitleMarginBottom: number;
  readonly avatarGroupMarginTop: number;
  readonly avatarSize: number;
  readonly iconOffset: number;
  readonly iconFontSize: number;
  readonly layoutSx: SxProps<Theme>;
}

export interface AvailabilityInsightsSharedOptions extends AvailabilityInsightsSharedStyleOptions {
  readonly CardComponent: ComponentType<{ readonly sx?: SxProps<Theme>; readonly children: ReactNode }>;
  readonly AvatarComponent: ComponentType<{
    readonly size?: number;
    readonly variant?: BaseAvatarVariant;
    readonly sx?: SxProps<Theme>;
    readonly children?: ReactNode;
  }>;
  readonly TimezoneDisplayComponent: ComponentType<{ readonly timezone?: IanaTimezone | null }>;
}

export interface AvailabilityInsightsSharedProps extends Readonly<AvailabilityInsightsProps> {
  readonly options: AvailabilityInsightsSharedOptions;
}

function InsightCard({
  title,
  value,
  description,
  icon,
  options,
}: Readonly<InsightCardProps & { options: AvailabilityInsightsSharedOptions }>) {
  return (
    <options.CardComponent
      sx={theme => ({
        p: theme.layout.cardPadding,
        display: "flex",
        flexDirection: "column",
        ...(options.cardFlex !== undefined ? { flex: options.cardFlex } : {}),
        minHeight: options.cardMinHeight,
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: options.insightTitleMarginBottom,
        }}
      >
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {title}
        </Typography>
        {icon}
      </Box>
      <Box sx={{ mt: "auto" }}>
        <Typography variant={options.valueVariant} sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
          {value}
        </Typography>
        <Typography variant={options.descriptionVariant} sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {description}
        </Typography>
      </Box>
    </options.CardComponent>
  );
}

function TimezoneInsight({
  timezones,
  labels,
  options,
}: Readonly<{
  timezones: readonly string[];
  labels: { title: string; description: string };
  options: AvailabilityInsightsSharedOptions;
}>) {
  return (
    <options.CardComponent
      sx={theme => ({
        p: theme.layout.cardPadding,
        display: "flex",
        flexDirection: "column",
        ...(options.cardFlex !== undefined ? { flex: options.cardFlex } : {}),
        minHeight: options.cardMinHeight,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="titleLg"
          sx={theme => ({ mb: options.timezoneTitleMarginBottom, color: theme.palette.primary.main })}
        >
          {labels.title}
        </Typography>
        <Typography variant={options.descriptionVariant} sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.description}
        </Typography>
      </Box>

      <AvatarGroup
        max={4}
        sx={theme => ({
          mt: options.avatarGroupMarginTop,
          justifyContent: "flex-end",
          flexDirection: "row-reverse",
          position: "relative",
          zIndex: 1,
          "& .MuiAvatar-root": {
            width: options.avatarSize,
            height: options.avatarSize,
            fontSize: theme.typography.labelSm.fontSize,
            fontWeight: 700,
            border: `2px solid ${theme.palette.background.paper}`,
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
          },
        })}
      >
        {timezones.map((tz, index) => (
          <Tooltip
            key={tz}
            title={<options.TimezoneDisplayComponent timezone={toIanaTimezoneOrNull(tz)} />}
            arrow
            describeChild
          >
            <options.AvatarComponent
              size={options.avatarSize}
              sx={theme => ({
                backgroundColor: index === 0 ? theme.palette.primaryContainer : theme.palette.secondaryContainer,
                color: index === 0 ? theme.palette.onPrimaryContainer : theme.palette.onSecondaryContainer,
              })}
            >
              {tz}
            </options.AvatarComponent>
          </Tooltip>
        ))}
      </AvatarGroup>

      <Box
        sx={{
          position: "absolute",
          right: -options.iconOffset,
          bottom: -options.iconOffset,
          opacity: 0.1,
          pointerEvents: "none",
        }}
      >
        <PublicOutlined sx={theme => ({ fontSize: options.iconFontSize, color: theme.palette.primary.main })} />
      </Box>
    </options.CardComponent>
  );
}

export function AvailabilityInsightsShared({ insights, labels, options }: Readonly<AvailabilityInsightsSharedProps>) {
  const t = labels;

  return (
    <AvailabilityInsightsLayout
      insights={insights}
      layoutSx={options.layoutSx}
      peakLoadCard={
        <InsightCard
          title={t.peakLoad}
          value={insights.peakLoad}
          description={t.peakLoadDesc}
          icon={<TrendingUpOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
          options={options}
        />
      }
      availableStaffCard={
        <InsightCard
          title={t.availableStaff}
          value={t.teachersCount(insights.availableStaff)}
          description={t.availableStaffDesc}
          icon={<PersonSearchOutlined sx={theme => ({ color: theme.palette.primary.main })} />}
          options={options}
        />
      }
      timezoneInsightCard={
        <TimezoneInsight
          timezones={insights.timezones}
          labels={{
            title: t.localTimezones,
            description: t.localTimezonesDesc,
          }}
          options={options}
        />
      }
    />
  );
}
