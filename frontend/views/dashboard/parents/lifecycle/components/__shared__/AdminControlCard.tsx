import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface AdminControlCardProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function AdminControlCard({ title, children }: Readonly<AdminControlCardProps>) {
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
        <AdminPanelSettingsOutlined sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}
