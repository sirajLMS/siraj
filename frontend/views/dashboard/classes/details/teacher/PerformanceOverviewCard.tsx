"use client";

import { Box, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";

interface PerformanceOverviewCardProps {
  readonly attendanceRate: number;
  readonly avgGrade: string;
  readonly lastClassDaysAgo: number;
  readonly hasData: boolean;
  readonly labels: {
    readonly previousPerformanceOverview: string;
    readonly attendanceRate: string;
    readonly avgGrade: string;
    readonly lastClass: string;
    readonly days: string;
    readonly noData: string;
  };
}

interface StatBoxProps {
  readonly label: string;
  readonly value: string;
}

// Rounded default-background container for a single performance stat
const StyledStatBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: 2,
  textAlign: "center",
}));

// Block-display secondary caption used above the stat value
const StyledStatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "block",
}));

// Primary-colored headline used as the stat value
const StyledStatValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Primary-colored section title above the stat grid
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

function StatBox({ label, value }: StatBoxProps) {
  return (
    <StyledStatBox>
      <StyledStatLabel variant="caption" sx={{ mb: 0.5 }}>
        {label}
      </StyledStatLabel>
      <StyledStatValue variant="headlineMd">{value}</StyledStatValue>
    </StyledStatBox>
  );
}

export function PerformanceOverviewCard({
  attendanceRate,
  avgGrade,
  lastClassDaysAgo,
  hasData,
  labels,
}: PerformanceOverviewCardProps) {
  return (
    <BaseCard>
      <StyledSectionTitle variant="titleLg" sx={{ mb: 2.5 }}>
        {labels.previousPerformanceOverview}
      </StyledSectionTitle>
      {hasData ? (
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
      ) : (
        <Typography
          variant="body2"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textAlign: "center", py: 2 })}
        >
          {labels.noData}
        </Typography>
      )}
    </BaseCard>
  );
}
