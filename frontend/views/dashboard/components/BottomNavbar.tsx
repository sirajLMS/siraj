"use client";

import { Box, Paper } from "@mui/material";
import { useTranslations } from "next-intl";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";
import { BOTTOM_NAV_SCROLL_THRESHOLD, BottomNavItemView } from "./BottomNavItemView";

interface BottomNavbarProps {
  readonly items: readonly NavItem[];
  readonly activeKey: string;
}

export function BottomNavbar({ items, activeKey }: Readonly<BottomNavbarProps>) {
  const t = useTranslations();
  const isScrollable = items.length > BOTTOM_NAV_SCROLL_THRESHOLD;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme => theme.zIndex.appBar,
        display: { xs: "block", md: "none" },
        borderTop: theme => `1px solid ${theme.palette.border.light}`,
        pb: "env(safe-area-inset-bottom)",
      }}
      elevation={3}
    >
      <Box
        component="nav"
        sx={theme => ({
          display: "flex",
          height: theme.layout.bottomNavHeight,
          backgroundColor: theme.palette.background.paper,
          overflowX: isScrollable ? "auto" : "hidden",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        })}
      >
        {items.map(item => (
          <BottomNavItemView
            key={item.key}
            itemKey={item.key}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            isActive={item.key === activeKey}
            isScrollable={isScrollable}
          />
        ))}
      </Box>
    </Paper>
  );
}
