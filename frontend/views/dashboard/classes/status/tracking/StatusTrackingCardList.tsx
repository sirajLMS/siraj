"use client";

import { BlockOutlined, PersonOutlined, ScheduleOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Typography, useTheme } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/components/ui";
import type { StatusSessionRow } from "@/frontend/stores/mockStatusTrackingStore";

interface StatusTrackingCardListProps {
  readonly rows: readonly StatusSessionRow[];
  readonly totalSessions: number;
  readonly labels: {
    readonly joinSession: string;
    readonly activate: string;
    readonly reschedule: string;
    readonly verifyDocuments: string;
    readonly sessionLocked: string;
    readonly seeAll: string;
    readonly todaySchedule: string;
    readonly regular: string;
    readonly suspendedPending: string;
    readonly onLeave: string;
    readonly pendingVerification: string;
  };
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}

const STATUS_LABEL_KEYS: Record<
  StatusSessionRow["status"],
  "regular" | "suspendedPending" | "onLeave" | "pendingVerification"
> = {
  regular: "regular",
  suspended_pending: "suspendedPending",
  on_leave: "onLeave",
  pending_verification: "pendingVerification",
};

// Common base styles shared by every card action button (uppercase label look)
const StyledCardActionButtonBase = styled(Button)(({ theme }) => ({
  fontFamily: theme.typography.labelUppercase.fontFamily,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  paddingBlock: theme.spacing(1.25),
  borderRadius: 2,
  marginTop: theme.spacing(2),
}));

// Outlined primary-colored activate button used when a session is suspended_pending
const StyledActivateActionButton = styled(StyledCardActionButtonBase)(({ theme }) => ({
  borderWidth: 2,
  color: theme.palette.primary.main,
  borderColor: theme.palette.primary.main,
  "&:hover": { borderWidth: 2 },
}));

// Bold primary-colored title text for the student name row
const StyledStudentNameText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "15px",
  color: theme.palette.text.primary,
}));

// Muted primary-colored subtitle text for the class name row
const StyledClassNameText = styled(Typography)(({ theme }) => ({
  fontSize: "12px",
  color: theme.palette.primary.main,
  fontWeight: 500,
}));

// Secondary-colored flex row used to render meta info pairs (teacher + schedule)
const StyledMetaInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  color: theme.palette.text.secondary,
}));

// Primary-colored headline used as the "Today's Schedule" section title
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: "18px",
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

// Small uppercase primary-colored "See All" button in the section header
const StyledSeeAllButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontFamily: theme.typography.labelUppercase.fontFamily,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
}));

// Circular student-initials avatar whose background and text follow the session status palette
const StyledStatusAvatar = styled(Box, {
  shouldForwardProp: prop => prop !== "bgcolorToken" && prop !== "colorToken",
})<{ bgcolorToken: string; colorToken: string }>(({ theme, bgcolorToken, colorToken }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  bgcolor: bgcolorToken,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: theme.typography.labelUppercase.fontFamily,
  fontSize: "14px",
  fontWeight: 700,
  color: colorToken,
  flexShrink: 0,
  border: `1px solid ${theme.palette.border.light}`,
}));

function getStatusIcon(status: StatusSessionRow["status"]) {
  if (status === "suspended_pending") {
    return <BlockOutlined sx={{ fontSize: 12 }} />;
  }
  if (status === "pending_verification") {
    return <WarningAmberOutlined sx={{ fontSize: 12 }} />;
  }
  return undefined;
}

function getCardActionButton(
  row: StatusSessionRow,
  labels: StatusTrackingCardListProps["labels"],
  onActivate: (id: string) => void,
  onVerify: (id: string) => void
) {
  if (row.status === "regular") {
    return (
      <StyledCardActionButtonBase
        id={`mobile-join-${row.id}`}
        fullWidth
        variant="contained"
        onClick={() => {
          /* join session */
        }}
      >
        {labels.joinSession}
      </StyledCardActionButtonBase>
    );
  }

  if (row.status === "suspended_pending") {
    return (
      <StyledActivateActionButton
        id={`mobile-activate-${row.id}`}
        fullWidth
        variant="outlined"
        onClick={() => {
          onActivate(row.id);
        }}
      >
        {labels.activate}
      </StyledActivateActionButton>
    );
  }

  if (row.status === "on_leave") {
    return (
      <StyledCardActionButtonBase id={`mobile-locked-${row.id}`} fullWidth disabled>
        {labels.sessionLocked}
      </StyledCardActionButtonBase>
    );
  }

  return (
    <StyledCardActionButtonBase
      id={`mobile-verify-${row.id}`}
      fullWidth
      variant="contained"
      onClick={() => {
        onVerify(row.id);
      }}
    >
      {labels.verifyDocuments}
    </StyledCardActionButtonBase>
  );
}

function getAvatarStyles(theme: Theme, status: StatusSessionRow["status"]) {
  if (status === "suspended_pending") {
    return {
      bgcolor: theme.palette.status.blockedContainer,
      color: theme.palette.status.onBlockedContainer,
    };
  }
  if (status === "on_leave") {
    return {
      bgcolor: theme.palette.secondaryContainer,
      color: theme.palette.onSecondaryContainer,
    };
  }
  if (status === "pending_verification") {
    return {
      bgcolor: theme.palette.status.pendingContainer,
      color: theme.palette.status.onPendingContainer,
    };
  }
  return {
    bgcolor: theme.palette.status.activeContainer,
    color: theme.palette.status.onActiveContainer,
  };
}

function StatusTrackingCard({
  row,
  labels,
  onActivate,
  onVerify,
}: {
  readonly row: StatusSessionRow;
  readonly labels: StatusTrackingCardListProps["labels"];
  readonly onActivate: (id: string) => void;
  readonly onVerify: (id: string) => void;
}) {
  const theme = useTheme();
  const avatarStyles = getAvatarStyles(theme, row.status);
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 3,
        border: `1px solid ${theme.palette.border.light}`,
        transition: "transform 0.15s ease",
        "&:active": { transform: "scale(0.98)" },
      })}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          {/* Avatar */}
          <StyledStatusAvatar bgcolorToken={avatarStyles.bgcolor} colorToken={avatarStyles.color}>
            {row.studentInitials}
          </StyledStatusAvatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <StyledStudentNameText>{row.studentName}</StyledStudentNameText>
                <StyledClassNameText>{row.className}</StyledClassNameText>
              </Box>
              <StatusBadge
                category="sessionTracking"
                status={row.status}
                label={labels[STATUS_LABEL_KEYS[row.status]]}
                icon={getStatusIcon(row.status)}
              />
            </Box>

            {/* Meta info */}
            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <StyledMetaInfoRow>
                <PersonOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: "13px" }}>{row.teacherName}</Typography>
              </StyledMetaInfoRow>
              <StyledMetaInfoRow>
                <ScheduleOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: "13px" }}>{row.schedule}</Typography>
              </StyledMetaInfoRow>
            </Box>
          </Box>
        </Box>

        {/* Action button */}
        {getCardActionButton(row, labels, onActivate, onVerify)}
      </CardContent>
    </Card>
  );
}

export function StatusTrackingCardList({
  rows,
  totalSessions,
  labels,
  onActivate,
  onReschedule: _onReschedule,
  onVerify,
}: StatusTrackingCardListProps) {
  return (
    <Box>
      {/* Section header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <StyledSectionTitle>
          {labels.todaysSchedule}{" "}
          <Box
            component="span"
            sx={theme => ({
              color: theme.palette.text.secondary,
              fontWeight: 400,
              fontSize: "14px",
            })}
          >
            ({totalSessions})
          </Box>
        </StyledSectionTitle>
        <StyledSeeAllButton id="status-see-all-btn" size="small">
          {labels.seeAll}
        </StyledSeeAllButton>
      </Box>

      {/* Cards */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map(row => (
          <StatusTrackingCard key={row.id} row={row} labels={labels} onActivate={onActivate} onVerify={onVerify} />
        ))}
      </Box>
    </Box>
  );
}
