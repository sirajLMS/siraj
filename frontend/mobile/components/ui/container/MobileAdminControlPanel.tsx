"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface MobileAdminControlPanelProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
}

/**
 * Mobile card panel matching Upcoming Classes card chrome
 * (header bar on `background.default` + bordered paper body).
 */
export function MobileAdminControlPanel({
  title,
  icon: Icon = AdminPanelSettingsOutlined,
  children,
}: MobileAdminControlPanelProps) {
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
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${theme.palette.border.main}`,
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: theme.palette.background.default,
        })}
      >
        <Icon sx={theme => ({ color: theme.palette.primary.main, fontSize: 20 })} />
        <Typography sx={theme => ({ typography: "titleMd", color: theme.palette.primary.main, fontWeight: 700 })}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}
