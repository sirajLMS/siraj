"use client";

import { SupportAgentOutlined } from "@mui/icons-material";
import { Fab, Tooltip } from "@mui/material";

interface ParentSupportFabProps {
  readonly label: string;
  readonly onClick: () => void;
}

export function ParentSupportFab({ label, onClick }: Readonly<ParentSupportFabProps>) {
  return (
    <Tooltip title={label} placement="left">
      <Fab
        aria-label={label}
        onClick={onClick}
        sx={theme => ({
          position: "fixed",
          bottom: 32,
          right: 32,
          bgcolor: theme.palette.header,
          color: theme.palette.onPrimary,
          "&:hover": { bgcolor: theme.palette.primary.dark },
        })}
      >
        <SupportAgentOutlined sx={{ fontSize: 28 }} />
      </Fab>
    </Tooltip>
  );
}
