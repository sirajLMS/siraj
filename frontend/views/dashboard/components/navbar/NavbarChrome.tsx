"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, alpha, Box, Toolbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { MobileMenuButton } from "@/frontend/views/dashboard/components/client/MobileMenuButton";

interface NavbarChromeProps {
  readonly roleLabel: string;
  readonly rightSlot: ReactNode;
}

export function NavbarChrome({ roleLabel, rightSlot }: Readonly<NavbarChromeProps>) {
  const t = useTranslations("dashboard");

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
          <MobileMenuButton />
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
              {t("layout.appTitle")}
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
