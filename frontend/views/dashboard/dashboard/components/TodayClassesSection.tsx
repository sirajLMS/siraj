// cspell:ignore: Hanken

"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { TodayClassesMobileScroll } from "./TodayClassesMobileScroll";

// Main wrapper for the "Today's Classes" section with bottom margin
const StyledSectionWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

// Header row containing section title and last-updated timestamp
const StyledSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(3),
}));

// Section title using Hanken Grotesk font for headline emphasis
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontFamily: '"Hanken Grotesk", sans-serif',
  fontWeight: 600,
}));

// Container for the clock icon and last-updated text
const StyledLastUpdatedBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
}));

// Small clock icon indicating time-of-last-refresh
const StyledClockIcon = styled(AccessTimeOutlined)(({ theme }) => ({
  fontSize: 16,
  color: theme.palette.text.secondary,
}));

// Timestamp label showing when metrics were last updated
const StyledLastUpdatedText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontSize: "12px",
  color: theme.palette.text.secondary,
  fontWeight: 400,
}));

interface TodayClassesSectionProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
}

export function TodayClassesSection({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
}: TodayClassesSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <StyledSectionWrapper>
      {/* Section Header with title and last-updated time */}
      <StyledSectionHeader>
        <StyledSectionTitle variant="headlineMd">{title}</StyledSectionTitle>

        <StyledLastUpdatedBox>
          <StyledClockIcon />
          <StyledLastUpdatedText>{lastUpdated}</StyledLastUpdatedText>
        </StyledLastUpdatedBox>
      </StyledSectionHeader>

      {/* Metric Cards Grid - mobile scroll or desktop grid based on viewport */}
      {isMobile ? (
        <TodayClassesMobileScroll metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedMetricKey} />
      ) : (
        <MetricCardGrid metrics={metrics} onMetricClick={onMetricClick} />
      )}
    </StyledSectionWrapper>
  );
}
