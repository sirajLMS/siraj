"use client";

import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { Box, IconButton, Paper, Stack, type Theme, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";

interface ScheduleOverviewCardListProps {
  readonly rows: readonly ScheduleRow[];
  readonly statusLabels: Record<ClassStatus, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
}

const CLASS_STATUS_MAP: Record<ClassStatus, string> = {
  scheduled: "scheduled",
  in_progress: "in_progress",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
  absent: "absent",
};

function getLeftBorderColor(status: ClassStatus, theme: Theme): string {
  switch (status) {
    case "in_progress":
      return theme.palette.primary.main;
    case "absent":
      return theme.palette.error.main;
    case "scheduled":
    case "pending":
      return theme.palette.outlineVariant;
    default:
      return theme.palette.border.light;
  }
}

// Centered message shown when there are no schedule rows
const StyledEmptyStateBox = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  textAlign: "center",
}));

// Individual schedule card with status-based left border and surface background
const StyledScheduleCard = styled(Paper, {
  shouldForwardProp: prop => prop !== "status" && prop !== "isAbsent",
})<{ status: ClassStatus; isAbsent: boolean }>(({ theme, status, isAbsent }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  opacity: isAbsent ? 0.8 : 1,
  backgroundColor: theme.palette.surfaceContainerLowest,
  border: `1px solid ${theme.palette.border.light}`,
  borderLeft: `4px solid ${getLeftBorderColor(status, theme)}`,
  boxShadow: theme.shadows[1],
}));

// Flex row splitting card content between info and actions
const StyledCardHeaderRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

// Meta row containing class ID, dot separator, and time
const StyledCardMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

// Uppercase class ID label
const StyledCardIdLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
}));

// Small dot separator between meta items
const StyledDotSeparator = styled(Box)(({ theme }) => ({
  width: 4,
  height: 4,
  borderRadius: "50%",
  backgroundColor: theme.palette.border.light,
}));

// Time display - highlighted when class is in progress
const StyledCardTimeText = styled(Typography, {
  shouldForwardProp: prop => prop !== "isInProgress",
})<{ isInProgress: boolean }>(({ theme, isInProgress }) => ({
  fontWeight: 700,
  color: isInProgress ? theme.palette.primary.main : theme.palette.text.secondary,
}));

// Student name displayed prominently in the card
const StyledStudentNameText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
  marginBottom: theme.spacing(0.25),
}));

// Right-aligned column containing status badge and details button
const StyledCardActionsColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: theme.spacing(1),
}));

// Details action button with hover state
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
  const locale = useLocale();

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
        const isAbsent = row.status === "absent";

        return (
          <StyledScheduleCard key={row.id} elevation={0} status={row.status} isAbsent={isAbsent}>
            <StyledCardHeaderRow>
              {/* Left side: class ID, time, and student name */}
              <Box sx={{ flex: 1 }}>
                <StyledCardMetaRow>
                  <StyledCardIdLabel variant="labelMd">ID: {row.classId.replace("#CLS-", "")}</StyledCardIdLabel>
                  <StyledDotSeparator />
                  <StyledCardTimeText variant="bodyMd" isInProgress={row.status === "in_progress"}>
                    {row.time}
                  </StyledCardTimeText>
                </StyledCardMetaRow>
                <StyledStudentNameText variant="titleLg">{row.student}</StyledStudentNameText>
              </Box>

              {/* Right side: status badge and details button */}
              <StyledCardActionsColumn>
                <StatusBadge
                  category="classStatus"
                  status={CLASS_STATUS_MAP[row.status]}
                  label={statusLabels[row.status]}
                  size="small"
                />
                <StyledDetailsIconButton
                  size="small"
                  onClick={() => router.push(`/${locale}/classes/${row.id}`)}
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
