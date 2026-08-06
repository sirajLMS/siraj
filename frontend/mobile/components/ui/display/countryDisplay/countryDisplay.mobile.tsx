"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { type CountryType, getCountryDisplayName, getCountryEmoji } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

export type MobileCountryDisplayProps = {
  readonly code?: string | null;
  readonly country?: CountryType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};

/**
 * Mobile-tier country display. Self-contained — no shared base.
 *
 * Differences vs desktop:
 * - Tighter `spacing={0.5}` (vs desktop `spacing={1}`) for dense inline rows.
 * - Default `typographyVariant="caption"` (vs desktop `"bodyMd"`) for compact
 *   mobile typography.
 * - `flexWrap: "nowrap"` to keep flag + label on a single tight row.
 */
export const MobileCountryDisplay = ({
  code,
  country,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant = "caption",
  sx,
}: MobileCountryDisplayProps): React.JSX.Element | null => {
  const locale = useAppLocale();
  const fallbackNode = fallback ? (
    <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
      {fallback}
    </Typography>
  ) : null;

  const resolvedCode = country?.code ?? code;
  if (!resolvedCode) {
    return fallbackNode;
  }

  const emoji = country?.emoji ?? getCountryEmoji(resolvedCode);
  const name = getCountryDisplayName(resolvedCode, locale);

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexWrap: "nowrap", ...sx }}>
      {showEmoji && <MobileLocaleEmoji emoji={emoji} />}
      {showLabel && (
        <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
          {name}
        </Typography>
      )}
    </Stack>
  );
};
