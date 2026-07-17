"use client";

import { Box, type Theme, Typography } from "@mui/material";
import type { SectionHeaderProps } from "@/frontend/common/views/dashboard/students/quota/types";

export function SectionHeaderMobile({
  title,
  mobileIcon: MobileIcon,
}: Readonly<Omit<SectionHeaderProps, "desktopIcon">>) {
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
      <MobileIcon
        sx={(theme: Theme) => ({
          color: theme.palette.primary.main,
        })}
      />
      <Typography
        variant="titleLg"
        sx={(theme: Theme) => ({
          color: theme.palette.primary.main,
        })}
      >
        {title}
      </Typography>
    </Box>
  );
}
