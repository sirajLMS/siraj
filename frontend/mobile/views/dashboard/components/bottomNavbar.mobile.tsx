"use client";

import { Box, Paper } from "@mui/material";
import { useNavLabels } from "@/frontend/common/views/dashboard/components/useNavLabels";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import {
  BOTTOM_NAV_SCROLL_THRESHOLD,
  BottomNavItemViewMobile,
} from "@/frontend/mobile/views/dashboard/components/bottomNavItemView.mobile";

interface BottomNavbarMobileProps {
  readonly items: readonly NavItem[];
  readonly activeKey: string;
}

export function BottomNavbarMobile({ items, activeKey }: Readonly<BottomNavbarMobileProps>) {
  const t = useNavLabels();
  const isScrollable = items.length > BOTTOM_NAV_SCROLL_THRESHOLD;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme => theme.zIndex.appBar,
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
          <BottomNavItemViewMobile
            key={item.key}
            itemKey={item.key}
            href={item.href}
            label={t(item.labelKey)}
            iconKey={item.iconKey}
            isActive={item.key === activeKey}
            isScrollable={isScrollable}
          />
        ))}
      </Box>
    </Paper>
  );
}
