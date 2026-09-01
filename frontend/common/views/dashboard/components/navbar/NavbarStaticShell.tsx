"use client";

import { AppBar, Box, Toolbar } from "@mui/material";
import type { ReactNode } from "react";
import { NavbarBrandBlock } from "@/frontend/common/views/dashboard/components/navbar/NavbarBrandBlock";

/**
 * NavbarStaticShell — SERVER COMPONENT rendering the dashboard navbar's
 * static chrome (AppBar + Toolbar + brand block: logo icon + app title +
 * role label Typography) into the initial HTML, before client hydration
 * completes.
 *
 * The app-title `<Typography>` here is the LCP candidate on chrome, so it
 * must render server-side (no hooks, no browser APIs, no
 * `useAppTranslation`). All strings are passed in as props by the
 * server-side `DashboardLayoutContainer`.
 *
 * CSS variable tokens (`var(--mui-palette-headerContainer)`, etc.) are used
 * directly instead of JS theme callbacks so the server component renders
 * deterministic HTML without requiring client ThemeProvider context.
 *
 * The brand-group markup itself is shared with `NavbarChrome` through
 * `NavbarBrandBlock`; this shell is the reason the fragment takes all colors
 * as plain CSS strings (CSS variables / `color-mix()` here) instead of theme
 * values. The two shells intentionally stay separate files: a unified
 * component with a variant prop would have to import the interactive
 * client-side chrome hooks (`useTheme`, `useAppTranslation`) into the
 * pre-hydration render path, breaking the guarantees above.
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
        <NavbarBrandBlock
          appTitle={appTitle}
          roleLabel={roleLabel}
          logoAriaLabel={logoAriaLabel}
          logoBackgroundColor="color-mix(in srgb, var(--mui-palette-onHeaderContainer) 15%, transparent)"
          brandNameColor="var(--mui-palette-onHeaderContainer)"
          roleColor="color-mix(in srgb, var(--mui-palette-onHeaderContainer) 70%, transparent)"
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>{children}</Box>
      </Toolbar>
    </AppBar>
  );
}
