"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface MobileAdminControlPanelProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
}

/**
 * Mobile card-style panel with an admin icon header row.
 * Tighter 3-unit padding, edge-to-edge behavior, and smaller icon heading
 * tuned for mobile screens.
 */
export function MobileAdminControlPanel({
  title,
  icon: Icon = AdminPanelSettingsOutlined,
  children,
}: MobileAdminControlPanelProps) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: 3,
        border: `1px solid ${theme.palette.border.main}`,
      })}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
        }}
      >
        <Icon sx={theme => ({ color: theme.palette.primary.main, fontSize: 20 })} />
        <Typography sx={theme => ({ typography: "titleMd", color: theme.palette.primary.main, fontWeight: 700 })}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}
