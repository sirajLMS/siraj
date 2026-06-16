"use client";

import InfoIcon from "@mui/icons-material/Info";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui";
import type { ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";

const STATUS_COLOR_MAP: Record<ClassInstanceStatus, "active" | "confirmed" | "pending" | "completed" | "cancelled"> = {
  active: "active",
  scheduled: "confirmed",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
};

interface ClassInstanceDetailsCardProps {
  readonly instanceId: string;
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

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography
        variant="labelUppercase"
        sx={theme => ({
          color: theme.palette.header,
        })}
      >
        {label}
      </Typography>
      <Box>{value}</Box>
    </Box>
  );
}

export function ClassInstanceDetailsCard({
  instanceId,
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
        <Typography
          variant="headlineMd"
          sx={theme => ({ color: theme.palette.primary.main, display: "flex", alignItems: "center", gap: 1 })}
        >
          <InfoIcon sx={theme => ({ color: theme.palette.header })} />
          {labels.classInstanceDetails}
        </Typography>
        <Chip
          label={`ID: #${instanceId}`}
          size="small"
          sx={theme => ({
            bgcolor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
            typography: "labelUppercase",
          })}
        />
      </Stack>

      <Grid container spacing={3} sx={theme => ({ pb: 4, borderBottom: 1, borderColor: theme.palette.border.light })}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField
            label={labels.studentName}
            value={
              <Typography variant="bodyLg" sx={{ fontWeight: 600 }}>
                {studentName}
              </Typography>
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
                <Box
                  sx={theme => ({
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: theme.palette.status[statusKey],
                  })}
                />
                <Typography variant="bodyLg" sx={{ fontWeight: 600 }}>
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
