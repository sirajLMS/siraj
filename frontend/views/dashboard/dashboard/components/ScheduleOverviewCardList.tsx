"use client";

import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { Box, IconButton, Paper, Stack, type Theme, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/dashboard/types/schedule";
import { resolveScheduleInstanceDisplayStatus } from "@/frontend/views/dashboard/dashboard/utils/scheduleInstanceStatus";
import { useRouter } from "@/shared/i18n/routing";
import { ScheduleInstanceStatusBadge } from "./ScheduleInstanceStatusBadge";

interface ScheduleOverviewCardListProps {
  readonly rows: readonly DailyScheduleRow[];
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
}

function getLeftBorderColor(displayStatus: ClassOutcome | ClassExecutionState, theme: Theme): string {
  switch (displayStatus) {
    case ClassExecutionState.Running:
    case ClassExecutionState.Activated:
      return theme.palette.primary.main;
    case ClassOutcome.Absent:
      return theme.palette.error.main;
    case ClassOutcome.Pending:
    case ClassExecutionState.NotActivated:
      return theme.palette.outlineVariant;
    default:
      return theme.palette.border.light;
  }
}

const StyledEmptyStateBox = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  textAlign: "center",
}));

const StyledScheduleCard = styled(Paper, {
  shouldForwardProp: prop => prop !== "displayStatus" && prop !== "isAbsent",
})<{
  displayStatus: ClassOutcome | ClassExecutionState;
  isAbsent: boolean;
}>(({ theme, displayStatus, isAbsent }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  opacity: isAbsent ? 0.8 : 1,
  backgroundColor: theme.palette.surfaceContainerLowest,
  border: `1px solid ${theme.palette.border.light}`,
  borderLeft: `4px solid ${getLeftBorderColor(displayStatus, theme)}`,
  boxShadow: theme.palette.shadow.card,
}));

const StyledCardHeaderRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const StyledCardMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

const StyledCardIdLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
}));

const StyledDotSeparator = styled(Box)(({ theme }) => ({
  width: 4,
  height: 4,
  borderRadius: "50%",
  backgroundColor: theme.palette.border.light,
}));

const StyledCardTimeText = styled(Typography, {
  shouldForwardProp: prop => prop !== "isInProgress",
})<{ isInProgress: boolean }>(({ theme, isInProgress }) => ({
  fontWeight: 700,
  color: isInProgress ? theme.palette.primary.main : theme.palette.text.secondary,
}));

const StyledStudentNameText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
  marginBottom: theme.spacing(0.25),
}));

const StyledCardActionsColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: theme.spacing(1),
}));

const StyledDetailsIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: "transparent",
    color: theme.palette.primary.main,
  },
}));

export function ScheduleOverviewCardList({
  rows,
  statusLabels,
  detailsLabel,
  emptyMessage,
}: ScheduleOverviewCardListProps) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <StyledEmptyStateBox>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {emptyMessage}
        </Typography>
      </StyledEmptyStateBox>
    );
  }

  return (
    <Stack spacing={1.5}>
      {rows.map(row => {
        const displayStatus = resolveScheduleInstanceDisplayStatus(row.outcome, row.executionState);
        const isAbsent = row.outcome === ClassOutcome.Absent;
        const isInProgress =
          displayStatus === ClassExecutionState.Running || displayStatus === ClassExecutionState.Activated;

        return (
          <StyledScheduleCard key={row.id ?? undefined} elevation={0} displayStatus={displayStatus} isAbsent={isAbsent}>
            <StyledCardHeaderRow>
              <Box sx={{ flex: 1 }}>
                <StyledCardMetaRow>
                  <StyledCardIdLabel variant="labelMd">ID: {row.id ?? ""}</StyledCardIdLabel>
                  <StyledDotSeparator />
                  <StyledCardTimeText variant="bodyMd" isInProgress={isInProgress}>
                    {row.yourTime ?? ""}
                  </StyledCardTimeText>
                </StyledCardMetaRow>
                <StyledStudentNameText variant="titleLg">
                  {row.student?.name ?? "Unknown Student"}
                </StyledStudentNameText>
              </Box>

              <StyledCardActionsColumn>
                <ScheduleInstanceStatusBadge
                  outcome={row.outcome}
                  executionState={row.executionState}
                  statusLabels={statusLabels}
                  size="small"
                />
                <StyledDetailsIconButton
                  size="small"
                  onClick={() => router.push(`/classes/${row.id ?? ""}`)}
                  aria-label={detailsLabel}
                >
                  <MoreVertIcon fontSize="small" />
                </StyledDetailsIconButton>
              </StyledCardActionsColumn>
            </StyledCardHeaderRow>
          </StyledScheduleCard>
        );
      })}
    </Stack>
  );
}
