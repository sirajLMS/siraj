"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, alpha, Box, Toolbar, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useAppTranslation } from "@/shared/locale/client";

interface NavbarChromeProps {
  readonly roleLabel: string;
  readonly rightSlot: ReactNode;
  readonly leftSlot?: ReactNode;
}

export function NavbarChrome({ roleLabel, rightSlot, leftSlot }: Readonly<NavbarChromeProps>) {
  const t = useAppTranslation().dashboardTranslations.coreLayout;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: "100%",
        backgroundColor: theme => theme.palette.headerContainer,
        color: theme => theme.palette.onHeaderContainer,
        zIndex: theme => theme.zIndex.drawer + 1,
        boxShadow: theme => theme.palette.shadow.card,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: theme => theme.layout.navbarHeight,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
          {leftSlot}
          <Box
            sx={theme => ({
              width: 40,
              height: 40,
              backgroundColor: alpha(theme.palette.onHeaderContainer, 0.15),
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <SchoolOutlined sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
            <Typography
              variant="titleLg"
              sx={{
                color: theme => theme.palette.onHeaderContainer,
                lineHeight: 1.2,
              }}
            >
              {t.appTitle}
            </Typography>
            <Typography
              variant="labelMd"
              sx={{
                color: theme => alpha(theme.palette.onHeaderContainer, 0.7),
                lineHeight: 1.2,
              }}
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>{rightSlot}</Box>
      </Toolbar>
    </AppBar>
  );
}
