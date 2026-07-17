"use client";

import { Box, type Theme, Typography } from "@mui/material";
import type { SectionHeaderProps } from "@/frontend/common/views/dashboard/students/quota/types";

export function SectionHeaderDesktop({
  title,
  desktopIcon: DesktopIcon,
}: Readonly<Omit<SectionHeaderProps, "mobileIcon">>) {
  return (
    <Box
      sx={(theme: Theme) => ({
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        pb: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      })}
    >
      <DesktopIcon
        sx={(theme: Theme) => ({
          color: theme.palette.primary.main,
        })}
      />
      <Typography
        variant="titleLg"
        sx={(theme: Theme) => ({
          color: theme.palette.primary.main,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "1.125rem",
        })}
      >
        {title}
      </Typography>
    </Box>
  );
}
