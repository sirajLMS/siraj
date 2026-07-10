import { Box, type Theme, Typography } from "@mui/material";

import type { SectionHeaderProps } from "@/frontend/views/dashboard/teachers/profile/types";

export function SectionHeader({ title, icon: Icon }: Readonly<SectionHeaderProps>) {
  return (
    <Box
      sx={(theme: Theme) => ({
        borderBottom: `1px solid ${theme.palette.border.light}`,
        pb: 2,
        mb: 4,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        color: theme.palette.primary.main,
      })}
    >
      <Icon />
      <Typography variant="titleLg">{title}</Typography>
    </Box>
  );
}
