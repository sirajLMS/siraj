import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, alpha, Box, Toolbar, Typography } from "@mui/material";
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
 * Interactive client islands (notification badge dropdown, user menu, theme
 * toggle, mobile sidebar toggle, language switcher) are slotted via the
 * `children` prop — the caller renders a `"use client"` island tree as
 * `{children}`. When `children` is empty, only the static chrome is emitted.
 *
 * This component is tier-neutral (no `.mobile`/`.desktop` suffix): it MUST
 * NOT import `useMediaQuery`, `useViewport`, or `ViewportContext`.
 *
 * Mirrors the visual structure of `NavbarChrome` (client) but with no
 * client-side behavior. `NavbarChrome` remains the client fallback for
 * non-server-rendered layouts; this shell is the SSR path.
 */

interface NavbarStaticShellProps {
  /**
   * Application title (e.g. "Siraj LMS") rendered server-side as the LCP
   * candidate. Already resolved to the active locale's string by the
   * caller — never a translation key.
   */
  readonly appTitle: string;
  /**
   * Role label (e.g. localized "Administrator") rendered as a secondary
   * line under the app title. Already localized by the caller.
   */
  readonly roleLabel: string;
  /**
   * Accessibility label for the brand logo icon. Already localized.
   */
  readonly logoAriaLabel: string;
  /**
   * Optional client-island slot rendered on the right side of the navbar
   * (notification button, user menu, theme toggle, language switcher,
   * mobile sidebar toggle). May be omitted; the navbar then renders only
   * static chrome.
   */
  readonly children?: ReactNode;
}

export function NavbarStaticShell({ appTitle, roleLabel, logoAriaLabel, children }: Readonly<NavbarStaticShellProps>) {
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
            <SchoolOutlined sx={{ fontSize: 24 }} aria-label={logoAriaLabel} />
          </Box>
          <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
            <Typography
              variant="titleLg"
              sx={{
                color: theme => theme.palette.onHeaderContainer,
                lineHeight: 1.2,
              }}
            >
              {appTitle}
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

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>{children}</Box>
      </Toolbar>
    </AppBar>
  );
}
