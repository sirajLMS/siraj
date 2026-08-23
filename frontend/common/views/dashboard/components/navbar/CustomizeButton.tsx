"use client";

import { PaletteOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
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
        sx={{ color: theme => theme.palette.onWarning }}
      >
        {t.customizeButton}
      </Button>
    </RequirePermission>
  );
}
