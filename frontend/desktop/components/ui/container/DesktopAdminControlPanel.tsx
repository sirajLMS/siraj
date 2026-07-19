"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface DesktopAdminControlPanelProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
}

/**
 * Desktop card panel matching Upcoming Classes card chrome
 * (header bar on `background.default` + bordered paper body).
 */
export function DesktopAdminControlPanel({
  title,
  icon: Icon = AdminPanelSettingsOutlined,
  children,
}: DesktopAdminControlPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
        width: "100%",
      })}
    >
      <Box
        sx={theme => ({
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${theme.palette.border.main}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: theme.palette.background.default,
        })}
      >
        <Icon sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
}
