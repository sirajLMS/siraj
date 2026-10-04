"use client";

import { HistoryOutlined, InfoOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type {
  StudentDirectoryDataGridLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";

type StudentRowActionsProps = Readonly<{
  row: StudentDirectoryRowExtended;
  labels: StudentDirectoryDataGridLabels;
  onViewProfile: (id: string) => void;
  onViewHistory: (id: string) => void;
}>;

export function StudentRowActions({ row, labels, onViewProfile, onViewHistory }: StudentRowActionsProps) {
  return (
    <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "flex-end" }}>
      <Box
        sx={{ display: "flex", gap: 0.5 }}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <Tooltip title={labels.viewProfile}>
          <IconButton
            id={`student-info-${row.id}`}
            size="small"
            onClick={() => {
              onViewProfile(row.id ?? "");
            }}
            sx={theme => ({
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            })}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={labels.viewHistory}>
          <IconButton
            id={`student-history-${row.id}`}
            size="small"
            onClick={() => {
              onViewHistory(row.id ?? "");
            }}
            sx={theme => ({
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            })}
          >
            <HistoryOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
