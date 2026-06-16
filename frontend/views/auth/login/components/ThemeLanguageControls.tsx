"use client";

import { Brightness4, Brightness7 } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { useThemeMode } from "@/frontend/hooks/useThemeMode";
import { LanguageSwitcher } from "@/frontend/views/dashboard/components/navbar/LanguageSwitcher";

export function ThemeLanguageControls() {
  const { mode, toggleTheme } = useThemeMode();

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
      <LanguageSwitcher />
      <IconButton
        onClick={toggleTheme}
        sx={theme => ({
          color: theme.palette.text.secondary,
          "&:hover": {
            color: theme.palette.primary.main,
          },
        })}
        aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      >
        {mode === "light" ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Box>
  );
}
