// cspell:disable
"use client";

import {
  PersonSearch as PersonSearchIcon,
  Public as PublicIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { Avatar, AvatarGroup, Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui/BaseCard";
import type { TeacherAvailabilityInsights } from "../types";

interface InsightCardProps {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

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
            fontSize: "10px",
            fontWeight: 700,
            border: `2px solid ${theme.palette.background.paper}`,
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
          },
        })}
      >
        {timezones.map(tz => (
          <Avatar
            key={tz}
            sx={theme => ({
              backgroundColor: tz === "AST" ? theme.palette.primaryContainer : theme.palette.secondaryContainer,
              color: tz === "AST" ? theme.palette.onPrimaryContainer : theme.palette.onSecondaryContainer,
            })}
          >
            {tz}
          </Avatar>
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
        <PublicIcon sx={theme => ({ fontSize: 120, color: theme.palette.primary.main })} />
      </Box>
    </BaseCard>
  );
}

interface AvailabilityInsightsProps {
  readonly insights: TeacherAvailabilityInsights;
}

export function AvailabilityInsights({ insights }: Readonly<AvailabilityInsightsProps>) {
  const t = useTranslations("dashboard.teacherAvailability.insights");

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        gap: 3,
        mt: 4,
      }}
    >
      <InsightCard
        title={t("peakLoad")}
        value={insights.peakLoad}
        description={t("peakLoadDesc")}
        icon={<TrendingUpIcon sx={theme => ({ color: theme.palette.primary.main })} />}
      />

      <InsightCard
        title={t("availableStaff")}
        value={t("teachersCount", { count: insights.availableStaff })}
        description={t("availableStaffDesc")}
        icon={<PersonSearchIcon sx={theme => ({ color: theme.palette.primary.main })} />}
      />

      <TimezoneInsight
        timezones={insights.timezones}
        labels={{
          title: t("localTimezones"),
          description: t("localTimezonesDesc"),
        }}
      />
    </Box>
  );
}
