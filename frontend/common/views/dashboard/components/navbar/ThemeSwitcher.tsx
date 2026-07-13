"use client";

import { DarkMode, LightMode } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { useThemeMode } from "@/frontend/common/hooks/useThemeMode";
import { NavbarIcon } from "@/frontend/common/views/dashboard/components/navbar/NavbarIcon";

export function ThemeSwitcher() {
  const t = useTranslations("common");
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <NavbarIcon tooltipTitle={t("themeTooltip")} onClick={toggleTheme}>
      {isDark ? <LightMode /> : <DarkMode />}
    </NavbarIcon>
  );
}
