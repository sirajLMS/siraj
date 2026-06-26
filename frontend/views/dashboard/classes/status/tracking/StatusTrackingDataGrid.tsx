"use client";

import { BlockOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Avatar, Box, type Theme, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import { StatusAction } from "./StatusBadgeAction";
import { computeSessionStatus, formatScheduleRange, type SessionStatus, type StatusTrackingRow } from "./types";

const StyledClassNameText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  whiteSpace: "normal",
  wordBreak: "break-word",
}));

interface StatusTrackingDataGridLabels {
  readonly studentClass: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly status: string;
  readonly actions: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  readonly noEntries: string;
}

interface StatusTrackingDataGridProps {
  readonly rows: readonly StatusTrackingRow[];
  readonly labels: StatusTrackingDataGridLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}

const STATUS_LABEL_KEYS: Record<SessionStatus, keyof StatusTrackingDataGridLabels> = {
  regular: "regular",
  suspended_pending: "suspendedPending",
  on_leave: "onLeave",
  pending_verification: "pendingVerification",
};

function getStatusIcon(sessionStatus: SessionStatus) {
  if (sessionStatus === "suspended_pending") {
    return <BlockOutlined sx={{ fontSize: 12 }} />;
  }
  if (sessionStatus === "pending_verification") {
    return <WarningAmberOutlined sx={{ fontSize: 12 }} />;
  }
  return undefined;
}

function sessionLabelStyles(
  theme: Theme,
  sessionStatus: SessionStatus
): {
  color?: string;
  backgroundColor?: string;
} {
  switch (sessionStatus) {
    case "suspended_pending":
      return {
        color: theme.palette.status.onBlockedContainer,
        backgroundColor: theme.palette.status.blockedContainer,
      };
    case "pending_verification":
      return {
        color: theme.palette.status.onPendingContainer,
        backgroundColor: theme.palette.status.pendingContainer,
      };
    case "on_leave":
      return {
        color: theme.palette.secondaryContainer,
        backgroundColor: theme.palette.onSecondaryContainer,
      };
    case "regular":
      return {
        color: theme.palette.status.onActiveContainer,
        backgroundColor: theme.palette.status.activeContainer,
      };
  }
}

export function StatusTrackingDataGrid({
  rows,
  labels,
  onActivate,
  onReschedule,
  onVerify,
}: StatusTrackingDataGridProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const columns = useMemo<GridColDef<StatusTrackingRow>[]>(() => {
    const actionLabels = {
      joinSession: labels.joinSession,
      activate: labels.activate,
      reschedule: labels.reschedule,
      verifyDocuments: labels.verifyDocuments,
      administrativeHold: labels.administrativeHold,
      holdDescription: labels.holdDescription,
    };

    return [
      {
        field: "studentName",
        headerName: labels.studentClass,
        flex: 1.3,
        minWidth: 220,
        renderCell: ({ row }) => {
          const status = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
          const styles = sessionLabelStyles(theme, status);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
              <Avatar
                alt={row.studentName ?? ""}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  fontSize: "13px",
                  fontWeight: 700,
                  backgroundColor: styles.backgroundColor,
                  color: styles.color,
                }}
              >
                {row.studentInitials ?? ""}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
                  {row.studentName ?? ""}
                </Typography>
                <StyledClassNameText variant="labelMd">{row.teacherName ?? ""}</StyledClassNameText>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "teacherName",
        headerName: labels.teacher,
        flex: 1,
        minWidth: 140,
        valueGetter: (_value, row) => row.teacherName ?? "",
      },
      {
        field: "schedule",
        headerName: labels.schedule,
        flex: 1,
        minWidth: 140,
        valueGetter: (_value, row) => formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt),
      },
      {
        field: "status",
        headerName: labels.status,
        width: 180,
        renderCell: ({ row }) => {
          const status = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
          return (
            <StatusBadge
              category="sessionTracking"
              status={status}
              label={labels[STATUS_LABEL_KEYS[status]]}
              icon={getStatusIcon(status)}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: labels.actions,
        width: isDesktop ? 200 : 80,
        flex: isDesktop ? 1 : 0,
        sortable: false,
        align: "right",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <StatusAction
            row={row}
            labels={actionLabels}
            onActivate={onActivate}
            onReschedule={onReschedule}
            onVerify={onVerify}
          />
        ),
      },
    ];
  }, [isDesktop, labels, onActivate, onReschedule, onVerify, theme]);

  return (
    <AppDataGrid<StatusTrackingRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id ?? ""}
      autoHeight
      rowHeight={100}
      ariaLabel="status-tracking-table"
      emptyMessage={labels.noEntries}
      getRowClassName={({ row }) =>
        computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState) === "suspended_pending"
          ? "status-row-suspended"
          : ""
      }
      sx={{
        "& .status-row-suspended": {
          backgroundColor: theme => alpha(theme.palette.status.blocked, 0.08),
          "&:hover": {
            backgroundColor: theme => alpha(theme.palette.status.blocked, 0.12),
          },
        },
      }}
    />
  );
}
