"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n/routing";

const BOTTOM_NAV_SCROLL_THRESHOLD = 5;
const BOTTOM_NAV_ITEM_MIN_WIDTH = 72;

interface BottomNavbarProps {
  readonly items: readonly NavItem[];
  readonly activeKey: string;
}

export function BottomNavbar({ items, activeKey }: BottomNavbarProps) {
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
        {items.map(item => {
          const IconComponent = item.icon;
          const isActive = item.key === activeKey;
          const label = t(item.labelKey);

          return (
            <Box
              key={item.key}
              component={Link}
              href={item.href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              sx={theme => ({
                flex: isScrollable ? `0 0 ${BOTTOM_NAV_ITEM_MIN_WIDTH}px` : 1,
                minWidth: isScrollable ? BOTTOM_NAV_ITEM_MIN_WIDTH : 0,
                maxWidth: isScrollable ? 80 : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                px: 0.5,
                py: 0.75,
                textDecoration: "none",
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                overflow: "hidden",
              })}
            >
              <IconComponent sx={{ fontSize: 20, flexShrink: 0 }} />
              <Typography
                variant="labelSm"
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  width: "100%",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: 0,
                  lineHeight: 1.2,
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
