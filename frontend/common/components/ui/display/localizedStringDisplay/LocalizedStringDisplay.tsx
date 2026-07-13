"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import { useLocale } from "next-intl";
import type * as React from "react";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";

export type LocalizedStringDisplayProps = {
  readonly value?: LocalizedString | null;
  readonly locale?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
  /**
   * Optional click handler forwarded to the underlying `Typography`. Useful
   * for interactive list/grid cells that render the resolved text as the
   * clickable affordance (e.g. a row's primary name cell).
   */
  readonly onClick?: React.MouseEventHandler<HTMLElement>;
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
  onClick,
}): React.ReactNode => {
  const uiLocale = useLocale();
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
