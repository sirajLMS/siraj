"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n/routing";

interface BottomNavbarProps {
  readonly items: readonly NavItem[];
  readonly activeKey: string;
}

export function BottomNavbar({ items, activeKey }: BottomNavbarProps) {
  const t = useTranslations();

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
      <Box
        component="nav"
        sx={theme => ({
          display: "flex",
          height: 64,
          backgroundColor: theme.palette.background.paper,
        })}
      >
        {items.map(item => {
          const IconComponent = item.icon;
          const isActive = item.key === activeKey;

          return (
            <Box
              key={item.key}
              component={Link}
              href={item.href}
              sx={theme => ({
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                py: 1,
                textDecoration: "none",
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              })}
            >
              <IconComponent fontSize="small" />
              <Typography
                variant="labelMd"
                sx={{
                  fontWeight: 500,
                }}
              >
                {t(item.labelKey)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
