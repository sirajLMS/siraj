"use client";

import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useTranslations } from "next-intl";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";

interface BottomNavbarProps {
  readonly items: readonly NavItem[];
  readonly activeKey: string;
  readonly onNavigate: (href: string) => void;
}

export function BottomNavbar({ items, activeKey, onNavigate }: BottomNavbarProps) {
  const t = useTranslations();
  const activeIndex = items.findIndex(item => item.key === activeKey);

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
      }}
      elevation={3}
    >
      <BottomNavigation
        value={Math.max(activeIndex, 0)}
        onChange={(_, newValue: number) => {
          onNavigate(items[newValue].href);
        }}
        showLabels
        sx={theme => ({
          height: 64,
          bgcolor: theme.palette.background.paper,
          "& .MuiBottomNavigationAction-root": {
            minWidth: "auto",
            py: 1,
            color: theme.palette.text.secondary,
            "&.Mui-selected": {
              color: theme.palette.primary.main,
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontFamily: '"Inter", sans-serif',
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.05em",
            mt: 0.5,
          },
        })}
      >
        {items.map(item => {
          const IconComponent = item.icon;
          return <BottomNavigationAction key={item.key} label={t(item.labelKey)} icon={<IconComponent />} />;
        })}
      </BottomNavigation>
    </Paper>
  );
}
