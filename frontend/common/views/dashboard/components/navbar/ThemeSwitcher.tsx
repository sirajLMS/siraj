"use client";

import { DarkMode, LightMode } from "@mui/icons-material";
import { useThemeMode } from "@/frontend/common/hooks/useThemeMode";
import { NavbarIcon } from "@/frontend/common/views/dashboard/components/navbar/NavbarIcon";
import { useAppTranslation } from "@/shared/locale/client";

export function ThemeSwitcher() {
  const t = useAppTranslation().commonTranslations;
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <NavbarIcon tooltipTitle={t.themeTooltip} onClick={toggleTheme}>
      {isDark ? <LightMode /> : <DarkMode />}
    </NavbarIcon>
  );
}
