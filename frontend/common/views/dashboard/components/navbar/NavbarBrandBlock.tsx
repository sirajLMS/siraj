import { SchoolOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

/**
 * NavbarBrandBlock — pure presentational fragment rendering the navbar's
 * brand group (optional leading slot + 40x40 logo icon box + app title /
 * role label column).
 *
 * This fragment is the single source of the brand-group markup shared by the
 * two navbar shells:
 *
 * - `NavbarStaticShell` (pre-hydration, server-rendered shell) passes CSS
 *   variable / `color-mix()` strings so it stays hook-free and
 *   theme-callback-free, rendering deterministic HTML without ThemeProvider.
 * - `NavbarChrome` (interactive client shell) resolves the same values from
 *   the MUI theme once and passes them in as computed CSS strings.
 *
 * Because both render contexts consume it, the fragment takes every color as
 * a plain CSS string and must contain no hooks or theme callbacks itself.
 * The `data-appearance-target` attributes are part of the shared markup so
 * the appearance live-preview DOM mutations find the same nodes regardless
 * of which shell rendered them.
 */

interface NavbarBrandBlockProps {
  readonly appTitle: string;
  readonly roleLabel: string;
  readonly logoBackgroundColor: string;
  readonly brandNameColor: string;
  readonly roleColor: string;
  readonly logoAriaLabel?: string;
  readonly leadingSlot?: ReactNode;
}

export function NavbarBrandBlock({
  appTitle,
  roleLabel,
  logoBackgroundColor,
  brandNameColor,
  roleColor,
  logoAriaLabel,
  leadingSlot,
}: Readonly<NavbarBrandBlockProps>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
      {leadingSlot}
      <Box
        sx={{
          width: 40,
          height: 40,
          backgroundColor: logoBackgroundColor,
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
          sx={{ color: brandNameColor, lineHeight: 1.2 }}
          data-appearance-target="brand-name"
        >
          {appTitle}
        </Typography>
        <Typography variant="labelMd" sx={{ color: roleColor, lineHeight: 1.2 }}>
          {roleLabel}
        </Typography>
      </Box>
    </Box>
  );
}
