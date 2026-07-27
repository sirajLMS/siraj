"use client";
import { InfoOutlined, MenuBookOutlined } from "@mui/icons-material";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { StudentEntityLink } from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n/routing";

const STATUS_COLOR_MAP: Record<ClassInstanceStatus, "active" | "confirmed" | "pending" | "completed" | "cancelled"> = {
  active: "active",
  scheduled: "confirmed",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
};

interface ClassInstanceDetailsCardProps {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseModule: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly subjectAvatarUrl?: string | null;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly status: ClassInstanceStatus;
  readonly rateAmount: string | null;
  readonly rateCurrency: string | null;
  readonly rateSource: string | null;
  readonly isRateOverridden: boolean;
  readonly labels: {
    readonly classInstanceDetails: string;
    readonly studentName: string;
    readonly courseModule: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly duration: string;
    readonly status: string;
    readonly viewSubject: string;
    readonly minutes: string;
    readonly statusLabels: Record<ClassInstanceStatus, string>;
    readonly rateSectionTitle: string;
    readonly effectiveRateLabel: string;
    readonly rateCurrencyLabel: string;
    readonly rateSourceLabel: string;
    readonly rateSourceOverride: string;
    readonly rateSourceRecurring: string;
    readonly rateSourceSubject: string;
    readonly rateSourceTeacher: string;
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
  studentId,
  studentName,
  courseModule,
  subjectId,
  subjectName,
  subjectAvatarUrl,
  startTime,
  endTime,
  durationMinutes,
  status,
  rateAmount,
  rateCurrency,
  rateSource,
  isRateOverridden,
  labels,
}: ClassInstanceDetailsCardProps) {
  const statusKey = STATUS_COLOR_MAP[status];
  const statusLabel = labels.statusLabels[status];
  const displaySubjectName = subjectName || courseModule;
  const rateSourceLabel = isRateOverridden
    ? labels.rateSourceOverride
    : rateSource === "RECURRING"
      ? labels.rateSourceRecurring
      : rateSource === "SUBJECT"
        ? labels.rateSourceSubject
        : labels.rateSourceTeacher;

  return (
    <BaseCard edgeToEdge>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <StyledCardHeading
          variant="headlineMd"
          sx={theme => ({ color: theme.palette.primary.main, gap: theme.spacing(1) })}
        >
          <StyledHeadingInfoIcon sx={theme => ({ color: theme.palette.header })} />
          {labels.classInstanceDetails}
        </StyledCardHeading>
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
          <DetailField
            label={labels.courseModule}
            value={
              <Stack sx={{ gap: 1 }}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                  <UserAvatar src={subjectAvatarUrl ?? undefined} label={displaySubjectName} size={40} />
                  <Typography variant="bodyLg">{displaySubjectName}</Typography>
                </Stack>
                {subjectId ? (
                  <Button
                    component={Link}
                    href={`/subjects/${subjectId}`}
                    variant="outlined"
                    size="small"
                    startIcon={<MenuBookOutlined />}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {labels.viewSubject}
                  </Button>
                ) : null}
              </Stack>
            }
          />
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

      {rateAmount != null && (
        <Stack sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: theme => theme.palette.border.light }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.header, mb: 2 })}>
            {labels.rateSectionTitle}
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label={labels.effectiveRateLabel}
                value={
                  <Typography variant="bodyLg" sx={theme => ({ fontWeight: theme.typography.fontWeightBold })}>
                    {rateCurrency ?? ""} {rateAmount}
                  </Typography>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label={labels.rateSourceLabel}
                value={<Typography variant="bodyLg">{rateSourceLabel}</Typography>}
              />
            </Grid>
          </Grid>
        </Stack>
      )}
    </BaseCard>
  );
}
