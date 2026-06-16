"use client";

import { BlockOutlined, PersonOutlined, ScheduleOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/components/ui";
import type { StatusSessionRow } from "@/frontend/stores/statusTrackingStore";

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

const STATUS_LABEL_KEYS: Record<
  StatusSessionRow["status"],
  "regular" | "suspendedPending" | "onLeave" | "pendingVerification"
> = {
  regular: "regular",
  suspended_pending: "suspendedPending",
  on_leave: "onLeave",
  pending_verification: "pendingVerification",
};

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
  const commonSx = (theme: Theme) => ({
    fontFamily: theme.typography.labelUppercase.fontFamily,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    py: 1.25,
    borderRadius: 2,
    mt: 2,
  });

  if (row.status === "regular") {
    return (
      <Button
        id={`mobile-join-${row.id}`}
        fullWidth
        variant="contained"
        onClick={() => {
          /* join session */
        }}
        sx={commonSx}
      >
        {labels.joinSession}
      </Button>
    );
  }

  if (row.status === "suspended_pending") {
    return (
      <Button
        id={`mobile-activate-${row.id}`}
        fullWidth
        variant="outlined"
        onClick={() => {
          onActivate(row.id);
        }}
        sx={theme => ({
          ...commonSx(theme),
          borderWidth: 2,
          color: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          "&:hover": { borderWidth: 2 },
        })}
      >
        {labels.activate}
      </Button>
    );
  }

  if (row.status === "on_leave") {
    return (
      <Button id={`mobile-locked-${row.id}`} fullWidth disabled sx={commonSx}>
        {labels.sessionLocked}
      </Button>
    );
  }

  return (
    <Button
      id={`mobile-verify-${row.id}`}
      fullWidth
      variant="contained"
      onClick={() => {
        onVerify(row.id);
      }}
      sx={commonSx}
    >
      {labels.verifyDocuments}
    </Button>
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
          <Box
            sx={theme => {
              const styles = getAvatarStyles(theme, row.status);
              return {
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: styles.bgcolor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: theme.typography.labelUppercase.fontFamily,
                fontSize: "14px",
                fontWeight: 700,
                color: styles.color,
                flexShrink: 0,
                border: `1px solid ${theme.palette.border.light}`,
              };
            }}
          >
            {row.studentInitials}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={theme => ({ fontWeight: 700, fontSize: "15px", color: theme.palette.text.primary })}>
                  {row.studentName}
                </Typography>
                <Typography sx={theme => ({ fontSize: "12px", color: theme.palette.primary.main, fontWeight: 500 })}>
                  {row.className}
                </Typography>
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
              <Box
                sx={theme => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  color: theme.palette.text.secondary,
                })}
              >
                <PersonOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: "13px" }}>{row.teacherName}</Typography>
              </Box>
              <Box
                sx={theme => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  color: theme.palette.text.secondary,
                })}
              >
                <ScheduleOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: "13px" }}>{row.schedule}</Typography>
              </Box>
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
        <Typography
          sx={theme => ({
            fontFamily: theme.typography.fontFamily,
            fontSize: "18px",
            fontWeight: 700,
            color: theme.palette.primary.main,
          })}
        >
          {labels.todaysSchedule}{" "}
          <Box
            component="span"
            sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 400, fontSize: "14px" })}
          >
            ({totalSessions})
          </Box>
        </Typography>
        <Button
          id="status-see-all-btn"
          size="small"
          sx={theme => ({
            color: theme.palette.primary.main,
            fontFamily: theme.typography.labelUppercase.fontFamily,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          })}
        >
          {labels.seeAll}
        </Button>
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
