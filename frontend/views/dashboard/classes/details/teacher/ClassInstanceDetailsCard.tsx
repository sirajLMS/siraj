"use client";
import { InfoOutlined } from "@mui/icons-material";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";
import { StudentEntityLink } from "../components/EntityLinks";

const STATUS_COLOR_MAP: Record<ClassInstanceStatus, "active" | "confirmed" | "pending" | "completed" | "cancelled"> = {
  active: "active",
  scheduled: "confirmed",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
};

interface ClassInstanceDetailsCardProps {
  readonly instanceId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly courseModule: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly status: ClassInstanceStatus;
  readonly labels: {
    readonly classInstanceDetails: string;
    readonly studentName: string;
    readonly courseModule: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly duration: string;
    readonly status: string;
    readonly minutes: string;
    readonly statusLabels: Record<ClassInstanceStatus, string>;
  };
}

interface DetailFieldProps {
  readonly label: string;
  readonly value: React.ReactNode;
}

const StyledDetailFieldLabel = styled(Typography)(() => ({}));

const StyledCardHeading = styled(Typography)(() => ({
  display: "flex",
  alignItems: "center",
}));

const StyledHeadingInfoIcon = styled(InfoOutlined)(() => ({}));

const StyledInstanceIdChip = styled(Chip)(() => ({
  typography: "labelUppercase",
}));

// Small status dot; bg color is set per-call via sx based on status key
const StyledStatusDot = styled(Box)({
  width: 10,
  height: 10,
  borderRadius: "50%",
});

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <StyledDetailFieldLabel variant="labelUppercase" sx={theme => ({ color: theme.palette.header })}>
        {label}
      </StyledDetailFieldLabel>
      <Box>{value}</Box>
    </Box>
  );
}

export function ClassInstanceDetailsCard({
  instanceId,
  studentId,
  studentName,
  courseModule,
  startTime,
  endTime,
  durationMinutes,
  status,
  labels,
}: ClassInstanceDetailsCardProps) {
  const statusKey = STATUS_COLOR_MAP[status];
  const statusLabel = labels.statusLabels[status];

  return (
    <BaseCard>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <StyledCardHeading
          variant="headlineMd"
          sx={theme => ({ color: theme.palette.primary.main, gap: theme.spacing(1) })}
        >
          <StyledHeadingInfoIcon sx={theme => ({ color: theme.palette.header })} />
          {labels.classInstanceDetails}
        </StyledCardHeading>
        <StyledInstanceIdChip
          label={`ID: #${instanceId}`}
          size="small"
          sx={theme => ({
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
          })}
        />
      </Stack>

      <Grid container spacing={3} sx={theme => ({ pb: 4, borderBottom: 1, borderColor: theme.palette.border.light })}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField
            label={labels.studentName}
            value={
              studentId ? (
                <StudentEntityLink studentId={studentId} name={studentName} variant="bodyLg" />
              ) : (
                <Typography variant="bodyLg" sx={theme => ({ fontWeight: theme.typography.fontWeightBold })}>
                  {studentName}
                </Typography>
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField label={labels.courseModule} value={<Typography variant="bodyLg">{courseModule}</Typography>} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField label={labels.startTime} value={<Typography variant="bodyLg">{startTime}</Typography>} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField label={labels.endTime} value={<Typography variant="bodyLg">{endTime}</Typography>} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField
            label={labels.duration}
            value={
              <Typography variant="bodyLg">
                {durationMinutes} {labels.minutes}
              </Typography>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField
            label={labels.status}
            value={
              <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                <StyledStatusDot sx={theme => ({ backgroundColor: theme.palette.status[statusKey] })} />
                <Typography variant="bodyLg" sx={theme => ({ fontWeight: theme.typography.fontWeightBold })}>
                  {statusLabel}
                </Typography>
              </Stack>
            }
          />
        </Grid>
      </Grid>
    </BaseCard>
  );
}
