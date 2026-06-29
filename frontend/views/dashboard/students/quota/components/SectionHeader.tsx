import { Box, type Theme, Typography } from "@mui/material";
import type { SectionHeaderProps } from "../types";

export function SectionHeader({
  title,
  desktopIcon: DesktopIcon,
  mobileIcon: MobileIcon,
}: Readonly<SectionHeaderProps>) {
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
          display: { xs: "none", md: "block" },
          color: theme.palette.primary.main,
        })}
      />
      <MobileIcon
        sx={(theme: Theme) => ({
          display: { xs: "block", md: "none" },
          color: theme.palette.primary.main,
        })}
      />
      <Typography
        variant="titleLg"
        sx={(theme: Theme) => ({
          color: theme.palette.primary.main,

          textTransform: { md: "uppercase" },
          letterSpacing: { md: "0.05em" },
          fontSize: { md: "1.125rem" },
        })}
      >
        {title}
      </Typography>
    </Box>
  );
}
