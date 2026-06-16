"use client";

import { BlockOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Avatar, Box, type Theme, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { StatusSessionRow } from "@/frontend/stores/statusTrackingStore";
import { StatusAction } from "./StatusBadgeAction";

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
  readonly rows: readonly StatusSessionRow[];
  readonly labels: StatusTrackingDataGridLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}

const STATUS_LABEL_KEYS: Record<StatusSessionRow["status"], keyof StatusTrackingDataGridLabels> = {
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

function labelStyles(
  theme: Theme,
  status: StatusSessionRow["status"]
): {
  color?: string;
  backgroundColor?: string;
} {
  switch (status) {
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
  const columns = useMemo<GridColDef<StatusSessionRow>[]>(() => {
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
          const styles = labelStyles(theme, row.status);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
              <Avatar
                src={row.studentAvatarUrl}
                alt={row.studentName}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  fontSize: "13px",
                  fontWeight: 700,
                  ...(!row.studentAvatarUrl && {
                    bgcolor: styles.backgroundColor,
                    color: styles.color,
                  }),
                }}
              >
                {row.studentInitials}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
                  {row.studentName}
                </Typography>
                <Typography
                  variant="labelMd"
                  sx={theme => ({
                    color: theme.palette.text.secondary,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  })}
                >
                  {row.className}
                </Typography>
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
      },
      {
        field: "schedule",
        headerName: labels.schedule,
        flex: 1,
        minWidth: 140,
      },
      {
        field: "status",
        headerName: labels.status,
        width: 180,
        renderCell: ({ row }) => (
          <StatusBadge
            category="sessionTracking"
            status={row.status}
            label={labels[STATUS_LABEL_KEYS[row.status]]}
            icon={getStatusIcon(row.status)}
          />
        ),
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
    <AppDataGrid<StatusSessionRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      autoHeight
      rowHeight={100}
      ariaLabel="status-tracking-table"
      emptyMessage={labels.noEntries}
      getRowClassName={({ row }) => (row.status === "suspended_pending" ? "status-row-suspended" : "")}
      sx={{
        "& .status-row-suspended": {
          bgcolor: theme => alpha(theme.palette.status.blocked, 0.08),
          "&:hover": {
            bgcolor: theme => alpha(theme.palette.status.blocked, 0.12),
          },
        },
      }}
    />
  );
}
