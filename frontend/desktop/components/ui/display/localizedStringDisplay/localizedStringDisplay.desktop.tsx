"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import type { LocalizedString } from "@/shared/types";

export type DesktopLocalizedStringDisplayProps = {
  readonly value?: LocalizedString | null;
  readonly locale?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
  readonly onClick?: React.MouseEventHandler<HTMLElement>;
};

/**
 * Desktop-tier resolved-string-only display for a JSONB `LocalizedString` map.
 *
 * Self-contained — no shared base. Mirrors the backend `resolveLocalized`
 * fallback chain (request → default `ar` → first available value → empty).
 * Renders *only* the resolved text — no `ar`/`en` chip, no flag, no language
 * label — so it stays clean for lists, previews, and user-facing pickers
 * where the raw map is available.
 */
export const DesktopLocalizedStringDisplay: React.FC<DesktopLocalizedStringDisplayProps> = ({
  value,
  locale,
  fallback,
  typographyVariant = "bodyMd",
  sx,
  onClick,
}): React.ReactNode => {
  const uiLocale = useAppLocale();
  const displayLocale = locale ?? uiLocale;

  const resolved = resolveLocalizedString(value, displayLocale);

  if (resolved === "") {
    return <>{fallback ?? null}</>;
  }

  const isRtl = displayLocale === "ar";

  return (
    <Typography variant={typographyVariant} dir={isRtl ? "rtl" : "ltr"} onClick={onClick} sx={sx}>
      {resolved}
    </Typography>
  );
};
