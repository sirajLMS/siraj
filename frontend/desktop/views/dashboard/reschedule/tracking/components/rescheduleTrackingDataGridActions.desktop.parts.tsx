"use client";

import { CheckOutlined, CloseOutlined, Details as DetailsIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  RescheduleTrackingDataGridLabels,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";

interface TrackingRowActionsCellProps {
  readonly row: TrackingRow;
  readonly labels: RescheduleTrackingDataGridLabels;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
}

export function TrackingRowActionsCell({
  row,
  labels,
  onApprove,
  onReject,
  onView,
}: Readonly<TrackingRowActionsCellProps>) {
  const rowId = row.id ?? "";
  if (row.status !== null && row.status === LeaveRequestStatus.Pending) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, width: "100%" }}>
          <Tooltip title={labels.approveLeave}>
            <IconButton
              id={`approve-leave-${rowId}`}
              size="small"
              onClick={() => {
                onApprove(rowId);
              }}
              sx={theme => ({
                typography: "labelUppercase",
                borderRadius: 1.5,
                boxShadow: "none",
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.dark, 0.9),
                },
              })}
            >
              <CheckOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={labels.rejectLeave}>
            <IconButton
              id={`reject-leave-${rowId}`}
              size="small"
              onClick={() => {
                onReject(rowId);
              }}
              sx={theme => ({
                typography: "labelUppercase",
                borderRadius: 1.5,
                boxShadow: "none",
                backgroundColor: theme.palette.error.main,
                color: theme.palette.onError,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.error.dark, 0.9),
                },
              })}
            >
              <CloseOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }

  return (
    <Tooltip title={labels.viewDetails}>
      <IconButton
        id={`view-tracking-${rowId}`}
        onClick={() => {
          onView(rowId);
        }}
        sx={theme => ({
          color: theme.palette.primary.main,
        })}
      >
        <DetailsIcon />
      </IconButton>
    </Tooltip>
  );
}
