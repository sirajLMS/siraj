"use client";

import { AppBar, alpha, Box, Toolbar, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { NavbarBrandBlock } from "@/frontend/common/views/dashboard/components/navbar/NavbarBrandBlock";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * NavbarChrome — the interactive client shell of the dashboard navbar.
 *
 * It shares its brand-group markup with `NavbarStaticShell` via
 * `NavbarBrandBlock`. Unlike the static shell, this component always runs
 * under a client ThemeProvider, so it resolves the brand colors from the MUI
 * theme palette and hands them to the fragment as computed CSS strings.
 *
 * The two shells intentionally stay separate: the static shell renders the
 * pre-hydration LCP markup on the server and must stay hook-free and
 * theme-callback-free, which this component (with `useAppTranslation` and
 * `useTheme`) cannot guarantee.
 */

interface NavbarChromeProps {
  readonly roleLabel: string;
  readonly rightSlot: ReactNode;
  readonly leftSlot?: ReactNode;
  /**
   * Brand overrides resolved from the published appearance row on the
   * server; fall back to the translated app title / default icon when absent.
   */
  readonly appTitle?: string;
  readonly appLogoUrl?: string | null;
}

export function NavbarChrome({ roleLabel, rightSlot, leftSlot, appTitle, appLogoUrl }: Readonly<NavbarChromeProps>) {
  const t = useAppTranslation(Translation.Dashboard.CoreLayout);
  const muiTheme = useTheme();

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
        <NavbarBrandBlock
          appTitle={appTitle ?? t.appTitle}
          roleLabel={roleLabel}
          logoUrl={appLogoUrl}
          logoBackgroundColor={alpha(muiTheme.palette.onHeaderContainer, 0.15)}
          brandNameColor={muiTheme.palette.onHeaderContainer}
          roleColor={alpha(muiTheme.palette.onHeaderContainer, 0.7)}
          leadingSlot={leftSlot}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>{rightSlot}</Box>
      </Toolbar>
    </AppBar>
  );
}
