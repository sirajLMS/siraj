"use client";

import { BlockOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Avatar, Box, type Theme, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { AppDataGrid } from "@/frontend/components/ui/dataGrid/AppDataGrid";
import { StatusAction } from "./StatusBadgeAction";
import {
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
  type StatusTrackingDataGridLabels,
  type StatusTrackingDataGridProps,
  type StatusTrackingRow,
} from "./types";

const StyledClassNameText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  whiteSpace: "normal",
  wordBreak: "break-word",
}));

const STATUS_LABEL_KEYS: Record<SessionStatus, keyof StatusTrackingDataGridLabels> = {
  [SessionStatus.REGULAR]: "regular",
  [SessionStatus.SUSPENDED_PENDING]: "suspendedPending",
  [SessionStatus.ON_LEAVE]: "onLeave",
  [SessionStatus.PENDING_VERIFICATION]: "pendingVerification",
};

function getStatusIcon(sessionStatus: SessionStatus) {
  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return <BlockOutlined sx={{ fontSize: 12 }} />;
  }
  if (sessionStatus === SessionStatus.PENDING_VERIFICATION) {
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
    case SessionStatus.SUSPENDED_PENDING:
      return {
        color: theme.palette.status.onBlockedContainer,
        backgroundColor: theme.palette.status.blockedContainer,
      };
    case SessionStatus.PENDING_VERIFICATION:
      return {
        color: theme.palette.status.onPendingContainer,
        backgroundColor: theme.palette.status.pendingContainer,
      };
    case SessionStatus.ON_LEAVE:
      return {
        color: theme.palette.secondaryContainer,
        backgroundColor: theme.palette.onSecondaryContainer,
      };
    case SessionStatus.REGULAR:
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
  onJoin,
}: StatusTrackingDataGridProps) {
  const theme = useTheme();
  const locale = useLocale();
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
                  typography: "bodyMd",
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
        valueGetter: (_value, row) => formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt, locale),
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
            onJoin={onJoin}
          />
        ),
      },
    ];
  }, [isDesktop, labels, locale, onActivate, onReschedule, onVerify, onJoin, theme]);

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
        computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState) === SessionStatus.SUSPENDED_PENDING
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
