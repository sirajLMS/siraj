"use client";

import { Box } from "@mui/material";
import { LanguageSwitcher, ThemeSwitcher } from "@/frontend/views/dashboard/components/navbar";

export function ThemeLanguageControls() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        display: "flex",
        gap: 2,
        alignItems: "center",
      }}
    >
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.headerContainer,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <LanguageSwitcher />
      </Box>
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.headerContainer,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <ThemeSwitcher />
      </Box>
    </Box>
  );
}
