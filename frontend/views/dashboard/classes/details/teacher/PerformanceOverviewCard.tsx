"use client";

import { Box, Grid, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui";

interface PerformanceOverviewCardProps {
  readonly attendanceRate: number;
  readonly avgGrade: string;
  readonly lastClassDaysAgo: number;
  readonly labels: {
    readonly previousPerformanceOverview: string;
    readonly attendanceRate: string;
    readonly avgGrade: string;
    readonly lastClass: string;
    readonly days: string;
  };
}

interface StatBoxProps {
  readonly label: string;
  readonly value: string;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        bgcolor: theme.palette.background.default,
        borderRadius: 2,
        textAlign: "center",
      })}
    >
      <Typography
        variant="caption"
        sx={theme => ({
          color: theme.palette.text.secondary,
          display: "block",
          mb: 0.5,
        })}
      >
        {label}
      </Typography>
      <Typography
        variant="headlineMd"
        sx={theme => ({
          color: theme.palette.primary.main,
        })}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function PerformanceOverviewCard({
  attendanceRate,
  avgGrade,
  lastClassDaysAgo,
  labels,
}: PerformanceOverviewCardProps) {
  return (
    <BaseCard>
      <Typography
        variant="titleLg"
        sx={theme => ({
          color: theme.palette.text.primary,
          mb: 2.5,
        })}
      >
        {labels.previousPerformanceOverview}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 4 }}>
          <StatBox label={labels.attendanceRate} value={`${attendanceRate}%`} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <StatBox label={labels.avgGrade} value={avgGrade} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <StatBox label={labels.lastClass} value={`${lastClassDaysAgo} ${labels.days}`} />
        </Grid>
      </Grid>
    </BaseCard>
  );
}
