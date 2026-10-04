"use client";

import ArticleIcon from "@mui/icons-material/Article";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, IconButton, Tooltip } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { ExportButton, FilterButton } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  DELETE_TINT,
  tintedIconActionSx,
} from "@/frontend/common/views/dashboard/classes/details/admin/adminActionsBar.helpers";

interface SecondaryAdminActionsProps {
  readonly labels: {
    readonly reschedule: string;
    readonly generateLog: string;
    readonly deleteInstance: string;
    readonly overrideRateButton: string;
  };
  readonly onReschedule: () => void;
  readonly onGenerateLog: () => void;
  readonly onDelete: () => void;
  readonly onOverrideRate: () => void;
}

export function SecondaryAdminActions({
  labels,
  onReschedule,
  onGenerateLog,
  onDelete,
  onOverrideRate,
}: SecondaryAdminActionsProps) {
  return (
    <>
      <RequirePermission permissions={[AppPermission.SessionReschedule]}>
        <Tooltip title={labels.reschedule}>
          <FilterButton
            aria-label={labels.reschedule}
            onClick={onReschedule}
            startIcon={<CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: "none" }}
          >
            <Box sx={{ display: { xs: "none", sm: "inline" } }}>{labels.reschedule}</Box>
          </FilterButton>
        </Tooltip>
      </RequirePermission>
      <Tooltip title={labels.generateLog}>
        <ExportButton
          aria-label={labels.generateLog}
          onClick={onGenerateLog}
          startIcon={<ArticleIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: "none" }}
        >
          <Box sx={{ display: { xs: "none", sm: "inline" } }}>{labels.generateLog}</Box>
        </ExportButton>
      </Tooltip>
      <Tooltip title={labels.overrideRateButton}>
        <FilterButton
          aria-label={labels.overrideRateButton}
          onClick={onOverrideRate}
          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: "none" }}
        >
          <Box sx={{ display: { xs: "none", sm: "inline" } }}>{labels.overrideRateButton}</Box>
        </FilterButton>
      </Tooltip>
      <IconButton
        aria-label={labels.deleteInstance}
        title={labels.deleteInstance}
        onClick={onDelete}
        sx={tintedIconActionSx(DELETE_TINT)}
      >
        <DeleteIcon />
      </IconButton>
    </>
  );
}
