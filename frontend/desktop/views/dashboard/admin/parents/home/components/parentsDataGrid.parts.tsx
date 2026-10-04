"use client";

import { TuneOutlined as LifecycleIcon, SettingsOutlined as SettingsIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type {
  ParentDirectoryRow,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { Link } from "@/shared/i18n";

type ParentRowActionsProps = Readonly<{
  row: ParentDirectoryRow;
  labels: ParentsDataGridLabels;
  onOpenSettings: (id: string) => void;
  canParentManageStatus: boolean;
}>;

export function ParentRowActions({ row, labels, onOpenSettings, canParentManageStatus }: ParentRowActionsProps) {
  return (
    <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", gap: 1 }}>
      {row.userId ? <ViewAsUserButton variant="link" targetUserId={row.userId} targetUserName={row.name} /> : null}
      {canParentManageStatus ? (
        <Tooltip title={labels.manageLifecycle}>
          <Link href={`/parents/${row.id}/lifecycle`} style={{ textDecoration: "none" }}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
              }}
              sx={theme => ({
                backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                color: theme.palette.secondary.main,
                borderRadius: 1.5,
                "&:hover": {
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.onSecondary,
                },
              })}
            >
              <LifecycleIcon fontSize="small" />
            </IconButton>
          </Link>
        </Tooltip>
      ) : null}
      <IconButton
        size="small"
        onClick={e => {
          e.stopPropagation();
          onOpenSettings(row.id);
        }}
        sx={theme => ({
          backgroundColor: alpha(theme.palette.info.main, 0.08),
          color: theme.palette.info.main,
          borderRadius: 1.5,
          "&:hover": {
            backgroundColor: theme.palette.info.main,
            color: theme.palette.onInfo,
          },
        })}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
