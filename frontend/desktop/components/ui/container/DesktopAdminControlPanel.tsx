"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface DesktopAdminControlPanelProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
}

/**
 * Desktop card-style panel with an admin icon header row.
 * Uses shadow + 4-unit padding tuned for desktop spacing.
 */
export function DesktopAdminControlPanel({
  title,
  icon: Icon = AdminPanelSettingsOutlined,
  children,
}: DesktopAdminControlPanelProps) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: 4,
        border: `1px solid ${theme.palette.border.main}`,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <Icon sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}
