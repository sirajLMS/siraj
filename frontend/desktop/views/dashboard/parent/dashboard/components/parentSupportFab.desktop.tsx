"use client";

import { SupportAgentOutlined } from "@mui/icons-material";
import { Fab, Tooltip } from "@mui/material";
import type { ParentSupportFabProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";

export function ParentSupportFabDesktop({ label, onClick }: Readonly<ParentSupportFabProps>) {
  return (
    <Tooltip title={label} placement="left">
      <Fab
        aria-label={label}
        onClick={onClick}
        sx={theme => ({
          position: "fixed",
          bottom: 32,
          right: 32,
          backgroundColor: theme.palette.header,
          color: theme.palette.onPrimary,
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        })}
      >
        <SupportAgentOutlined sx={{ fontSize: 28 }} />
      </Fab>
    </Tooltip>
  );
}
