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
  readonly latencyMs: number | null;
  readonly authorizationLabel: string | null;
  readonly showLiveMetadata: boolean;
  readonly labels: {
    readonly metadata: string;
    readonly scheduledDate: string;
    readonly duration: string;
    readonly latency: string;
    readonly authorization: string;
    readonly minutes: string;
    readonly unavailable: string;
  };
}

interface MetadataRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: React.ReactNode;
}

const StyledLabelRow = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledRowDivider = styled(Divider)(() => ({}));

const StyledMetadataHeader = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  display: "block",
}));

const StyledPrimaryValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
}));

const StyledActiveValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.status.active,
  fontWeight: 700,
}));

const StyledUnavailableText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
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
      <StyledRowDivider sx={theme => ({ borderColor: theme.palette.outlineVariant })} />
    </>
  );
}

function formatValue(value: string | number | null | undefined, fallback: string): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return (
      <StyledUnavailableText
        variant="caption"
        sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: theme.typography.fontWeightBold })}
      >
        {fallback}
      </StyledUnavailableText>
    );
  }
  return <StyledPrimaryValueText variant="caption">{value}</StyledPrimaryValueText>;
}

export function MetadataCard({
  scheduledDate,
  durationMinutes,
  latencyMs,
  authorizationLabel,
  showLiveMetadata,
  labels,
}: MetadataCardProps) {
  return (
    <BaseCard edgeToEdge sx={{ height: "100%" }}>
      <StyledMetadataHeader variant="labelUppercase" sx={theme => ({ mb: 2, color: theme.palette.onSurfaceVariant })}>
        {labels.metadata}
      </StyledMetadataHeader>

      <Stack sx={{ gap: 0 }}>
        <MetadataRow
          icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
          label={labels.scheduledDate}
          value={formatValue(scheduledDate, labels.unavailable)}
        />
        <MetadataRow
          icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
          label={labels.duration}
          value={
            <StyledPrimaryValueText
              variant="caption"
              sx={theme => ({ color: theme.palette.primary.main, fontWeight: theme.typography.fontWeightBold })}
            >
              {durationMinutes} {labels.minutes}
            </StyledPrimaryValueText>
          }
        />
        {showLiveMetadata ? (
          <>
            <MetadataRow
              icon={<RouterIcon sx={{ fontSize: 18 }} />}
              label={labels.latency}
              value={
                latencyMs == null ? (
                  formatValue(null, labels.unavailable)
                ) : (
                  <StyledActiveValueText
                    variant="caption"
                    sx={theme => ({ color: theme.palette.status.active, fontWeight: theme.typography.fontWeightBold })}
                  >
                    {latencyMs}ms
                  </StyledActiveValueText>
                )
              }
            />
            <MetadataRow
              icon={<VerifiedUserIcon sx={{ fontSize: 18 }} />}
              label={labels.authorization}
              value={formatValue(authorizationLabel, labels.unavailable)}
            />
          </>
        ) : null}
      </Stack>
    </BaseCard>
  );
}
