"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RouterIcon from "@mui/icons-material/Router";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";

interface MetadataCardProps {
  readonly scheduledDate: string;
  readonly durationMinutes: number;
  readonly latencyMs: number;
  readonly authorization: string;
  readonly labels: {
    readonly metadata: string;
    readonly scheduledDate: string;
    readonly duration: string;
    readonly latency: string;
    readonly authorization: string;
    readonly minutes: string;
    readonly optimal: string;
  };
}

interface MetadataRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: React.ReactNode;
}

// Muted onSurfaceVariant flex row that holds the label + icon pair on the left
const StyledLabelRow = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
  color: theme.palette.onSurfaceVariant,
}));

// OutlineVariant divider placed between metadata rows
const StyledRowDivider = styled(Divider)(({ theme }) => ({
  borderColor: theme.palette.outlineVariant,
}));

// Block-display uppercase muted caption used as the card header
const StyledMetadataHeader = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  display: "block",
}));

// Bold primary-colored value text used for most metadata fields
const StyledPrimaryValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
}));

// Bold active-status-colored value text used for the latency field
const StyledActiveValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.status.active,
  fontWeight: 700,
}));

function MetadataRow({ icon, label, value }: MetadataRowProps) {
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
        <StyledLabelRow direction="row">
          <Box sx={{ fontSize: 18, display: "flex" }}>{icon}</Box>
          <Typography variant="body2">{label}</Typography>
        </StyledLabelRow>
        {value}
      </Stack>
      <StyledRowDivider />
    </>
  );
}

export function MetadataCard({ scheduledDate, durationMinutes, latencyMs, authorization, labels }: MetadataCardProps) {
  return (
    <BaseCard sx={{ height: "100%" }}>
      <StyledMetadataHeader variant="labelUppercase" sx={{ mb: 2 }}>
        {labels.metadata}
      </StyledMetadataHeader>

      <Stack sx={{ gap: 0 }}>
        <MetadataRow
          icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
          label={labels.scheduledDate}
          value={<StyledPrimaryValueText variant="caption">{scheduledDate}</StyledPrimaryValueText>}
        />
        <MetadataRow
          icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
          label={labels.duration}
          value={
            <StyledPrimaryValueText variant="caption">
              {durationMinutes} {labels.minutes}
            </StyledPrimaryValueText>
          }
        />
        <MetadataRow
          icon={<RouterIcon sx={{ fontSize: 18 }} />}
          label={labels.latency}
          value={
            <StyledActiveValueText variant="caption">
              {latencyMs}ms ({labels.optimal})
            </StyledActiveValueText>
          }
        />
        <MetadataRow
          icon={<VerifiedUserIcon sx={{ fontSize: 18 }} />}
          label={labels.authorization}
          value={<StyledPrimaryValueText variant="caption">{authorization}</StyledPrimaryValueText>}
        />
      </Stack>
    </BaseCard>
  );
}
