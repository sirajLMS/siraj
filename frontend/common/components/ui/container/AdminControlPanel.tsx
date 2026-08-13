import { AdminPanelSettingsOutlined, type SvgIconComponent } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface AdminControlPanelProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
}

/**
 * Card-style panel with an admin icon header row.
 * Used for admin control sections (status management, lifecycle controls, etc.).
 */
export function AdminControlPanel({
  title,
  icon: Icon = AdminPanelSettingsOutlined,
  children,
}: AdminControlPanelProps) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: { xs: 3, md: 4 },
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
