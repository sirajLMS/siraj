"use client";

import { BlockOutlined, PersonOutlined, ScheduleOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Typography, useTheme } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/components/ui";
import { computeSessionStatus, formatScheduleRange, type SessionStatus, type StatusTrackingRow } from "./types";

interface StatusTrackingCardListProps {
  readonly rows: readonly StatusTrackingRow[];
  readonly totalSessions: number;
  readonly labels: {
    readonly joinSession: string;
    readonly activate: string;
    readonly reschedule: string;
    readonly verifyDocuments: string;
    readonly sessionLocked: string;
    readonly seeAll: string;
    readonly todaysSchedule: string;
    readonly regular: string;
    readonly suspendedPending: string;
    readonly onLeave: string;
    readonly pendingVerification: string;
  };
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}

const STATUS_LABEL_KEYS: Record<SessionStatus, "regular" | "suspendedPending" | "onLeave" | "pendingVerification"> = {
  regular: "regular",
  suspended_pending: "suspendedPending",
  on_leave: "onLeave",
  pending_verification: "pendingVerification",
};

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

const StyledActivateActionButton = styled(StyledCardActionButtonBase)(({ theme }) => ({
  borderWidth: 2,
  color: theme.palette.primary.main,
  borderColor: theme.palette.primary.main,
  "&:hover": { borderWidth: 2 },
}));

const StyledStudentNameText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "15px",
  color: theme.palette.text.primary,
}));

const StyledClassNameText = styled(Typography)(({ theme }) => ({
  fontSize: "12px",
  color: theme.palette.primary.main,
  fontWeight: 500,
}));

const StyledMetaInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  color: theme.palette.text.secondary,
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: "18px",
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledSeeAllButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontFamily: theme.typography.labelUppercase.fontFamily,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
}));

const StyledStatusAvatar = styled(Box, {
  shouldForwardProp: prop => prop !== "bgcolorToken" && prop !== "colorToken",
})<{ bgcolorToken: string; colorToken: string }>(({ theme, bgcolorToken, colorToken }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  backgroundColor: bgcolorToken,
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

function getStatusIcon(sessionStatus: SessionStatus) {
  if (sessionStatus === "suspended_pending") {
    return <BlockOutlined sx={{ fontSize: 12 }} />;
  }
  if (sessionStatus === "pending_verification") {
    return <WarningAmberOutlined sx={{ fontSize: 12 }} />;
  }
  return undefined;
}

function getCardActionButton(
  row: StatusTrackingRow,
  sessionStatus: SessionStatus,
  labels: StatusTrackingCardListProps["labels"],
  onActivate: (id: string) => void,
  onVerify: (id: string) => void
) {
  const rowId = row.id ?? "";

  if (sessionStatus === "regular") {
    return (
      <StyledCardActionButtonBase
        id={`mobile-join-${rowId}`}
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

  if (sessionStatus === "suspended_pending") {
    return (
      <StyledActivateActionButton
        id={`mobile-activate-${rowId}`}
        fullWidth
        variant="outlined"
        onClick={() => {
          onActivate(rowId);
        }}
      >
        {labels.activate}
      </StyledActivateActionButton>
    );
  }

  if (sessionStatus === "on_leave") {
    return (
      <StyledCardActionButtonBase id={`mobile-locked-${rowId}`} fullWidth disabled>
        {labels.sessionLocked}
      </StyledCardActionButtonBase>
    );
  }

  return (
    <StyledCardActionButtonBase
      id={`mobile-verify-${rowId}`}
      fullWidth
      variant="contained"
      onClick={() => {
        onVerify(rowId);
      }}
    >
      {labels.verifyDocuments}
    </StyledCardActionButtonBase>
  );
}

function getAvatarStyles(theme: Theme, sessionStatus: SessionStatus) {
  if (sessionStatus === "suspended_pending") {
    return {
      backgroundColor: theme.palette.status.blockedContainer,
      color: theme.palette.status.onBlockedContainer,
    };
  }
  if (sessionStatus === "on_leave") {
    return {
      backgroundColor: theme.palette.secondaryContainer,
      color: theme.palette.onSecondaryContainer,
    };
  }
  if (sessionStatus === "pending_verification") {
    return {
      backgroundColor: theme.palette.status.pendingContainer,
      color: theme.palette.status.onPendingContainer,
    };
  }
  return {
    backgroundColor: theme.palette.status.activeContainer,
    color: theme.palette.status.onActiveContainer,
  };
}

function StatusTrackingCard({
  row,
  labels,
  onActivate,
  onVerify,
}: {
  readonly row: StatusTrackingRow;
  readonly labels: StatusTrackingCardListProps["labels"];
  readonly onActivate: (id: string) => void;
  readonly onVerify: (id: string) => void;
}) {
  const theme = useTheme();
  const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
  const avatarStyles = getAvatarStyles(theme, sessionStatus);
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
          <StyledStatusAvatar bgcolorToken={avatarStyles.bgcolor} colorToken={avatarStyles.color}>
            {row.studentInitials ?? ""}
          </StyledStatusAvatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <StyledStudentNameText>{row.studentName ?? ""}</StyledStudentNameText>
                <StyledClassNameText>{row.teacherName ?? ""}</StyledClassNameText>
              </Box>
              <StatusBadge
                category="sessionTracking"
                status={sessionStatus}
                label={labels[STATUS_LABEL_KEYS[sessionStatus]]}
                icon={getStatusIcon(sessionStatus)}
              />
            </Box>

            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <StyledMetaInfoRow>
                <PersonOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: "13px" }}>{row.teacherName ?? ""}</Typography>
              </StyledMetaInfoRow>
              <StyledMetaInfoRow>
                <ScheduleOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: "13px" }}>
                  {formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt)}
                </Typography>
              </StyledMetaInfoRow>
            </Box>
          </Box>
        </Box>

        {getCardActionButton(row, sessionStatus, labels, onActivate, onVerify)}
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map(row => (
          <StatusTrackingCard
            key={row.id ?? ""}
            row={row}
            labels={labels}
            onActivate={onActivate}
            onVerify={onVerify}
          />
        ))}
      </Box>
    </Box>
  );
}
