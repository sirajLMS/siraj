"use client";

import { PaletteOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { usePathname, useSearchParams } from "next/navigation";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { Link } from "@/shared/i18n/link";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * CustomizeButton — dashboard header entry point to the site-appearance
 * customizer overlay.
 *
 * Renders only when the current user holds
 * `AppPermission.SETTINGS_APPEARANCE_MANAGE` (via `RequirePermission`).
 * Links to the current URL with `?customize=1` appended — existing query
 * params are preserved. The customizer overlay (Task 6.1+) reads that
 * search param to mount the live-editing UI.
 *
 * Amber/warning palette tokens are used for the button chrome so the CTA
 * stands out against the header container without violating the
 * "no hardcoded colors" rule (frontend/AGENTS.md). The foreground uses
 * the Material 3 `onWarning` sibling token rather than `contrastText`.
 */
export function CustomizeButton() {
  const t = useAppTranslation(Translation.Dashboard.CoreLayout);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // AC-19: hide the Customize button when already in customize mode — the
  // amber toolbar (CustomizeToolbar) replaces it as the exit/publish surface.
  // Showing both would be redundant + confusing (two amber entry points).
  const alreadyCustomizing = searchParams?.get("customize") === "1";
  if (alreadyCustomizing) {
    return null;
  }

  const customizeParams = new URLSearchParams(searchParams?.toString() ?? "");
  customizeParams.set("customize", "1");
  const href = `${pathname}?${customizeParams.toString()}`;

  return (
    <RequirePermission permissions={AppPermission.SettingsAppearanceManage}>
      <Button
        component={Link}
        href={href}
        variant="contained"
        color="warning"
        size="small"
        startIcon={<PaletteOutlined />}
        aria-label={t.customizeButton}
        sx={{
          color: theme => theme.palette.onWarning,
          // Icon-only below md: the literal label is the widest item in the
          // navbar's right cluster and pushes the avatar off-viewport at
          // 390px. Desktop keeps icon + label.
          minWidth: { xs: 40, md: 64 },
          px: { xs: 0.5, md: 2 },
          "& .MuiButton-startIcon": { mx: { xs: 0, md: undefined } },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
          {t.customizeButton}
        </Box>
      </Button>
    </RequirePermission>
  );
}
