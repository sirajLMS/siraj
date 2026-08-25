"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import type { ReactNode } from "react";

/**
 * NavbarStaticShell — SERVER COMPONENT rendering the dashboard navbar's
 * static chrome (AppBar + Toolbar + brand box: logo icon + app title +
 * role label Typography) into the initial HTML, before client hydration
 * completes.
 *
 * The app-title `<Typography>` here is the LCP candidate on chrome, so it
 * must render server-side (no `"use client"`, no React hooks, no browser
 * APIs, no `useAppTranslation`). All strings are passed in as props by the
 * server-side `DashboardLayoutContainer`.
 *
 * CSS variable tokens (`var(--mui-palette-headerContainer)`, etc.) are used
 * directly instead of JS theme callbacks so the server component renders
 * deterministic HTML without requiring client ThemeProvider context.
 */

interface NavbarStaticShellProps {
  readonly appTitle: string;
  readonly roleLabel: string;
  readonly logoAriaLabel: string;
  readonly children?: ReactNode;
}

export function NavbarStaticShell({ appTitle, roleLabel, logoAriaLabel, children }: Readonly<NavbarStaticShellProps>) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="transparent"
      sx={{
        width: "100%",
        backgroundColor: "var(--mui-palette-headerContainer) !important",
        color: "var(--mui-palette-onHeaderContainer) !important",
        zIndex: 1201,
        boxShadow: "var(--mui-palette-shadow-card)",
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: "64px",
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "color-mix(in srgb, var(--mui-palette-onHeaderContainer) 15%, transparent)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            data-appearance-target="brand-logo"
          >
            <SchoolOutlined sx={{ fontSize: 24 }} aria-label={logoAriaLabel} />
          </Box>
          <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
            <Typography
              variant="titleLg"
              sx={{
                color: "var(--mui-palette-onHeaderContainer)",
                lineHeight: 1.2,
              }}
              data-appearance-target="brand-name"
            >
              {appTitle}
            </Typography>
            <Typography
              variant="labelMd"
              sx={{
                color: "color-mix(in srgb, var(--mui-palette-onHeaderContainer) 70%, transparent)",
                lineHeight: 1.2,
              }}
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>{children}</Box>
      </Toolbar>
    </AppBar>
  );
}
