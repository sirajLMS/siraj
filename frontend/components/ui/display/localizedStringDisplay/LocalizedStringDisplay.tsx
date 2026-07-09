"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import { useLocale } from "next-intl";
import type * as React from "react";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import type { LocalizedString } from "@/frontend/types/localized-string.types";

export type LocalizedStringDisplayProps = {
  readonly value?: LocalizedString | null;
  readonly locale?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};

/**
 * Resolved-string-only display for a JSONB `LocalizedString` map.
 *
 * Mirrors the backend `resolveLocalized` fallback chain (request → default
 * `ar` → first available value → empty). Renders *only* the resolved text —
 * no `ar`/`en` chip, no flag, no language label — so it stays clean for
 * lists, previews, and user-facing pickers where the raw map is available.
 */
export const LocalizedStringDisplay: React.FC<LocalizedStringDisplayProps> = ({
  value,
  locale,
  fallback,
  typographyVariant,
  sx,
}): React.ReactNode => {
  const uiLocale = useLocale();
  const displayLocale = locale ?? uiLocale;

  const resolved = resolveLocalizedString(value, displayLocale);

  if (resolved === "") {
    return <>{fallback ?? null}</>;
  }

  const isRtl = displayLocale === "ar";

  return (
    <Typography variant={typographyVariant} dir={isRtl ? "rtl" : "ltr"} sx={sx}>
      {resolved}
    </Typography>
  );
};
