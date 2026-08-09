"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import {
  fromGraphqlIanaTimezone,
  getTimezoneEmoji,
  getTimezonePathLabel,
  getTimezoneSelectLabel,
} from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

export type MobileTimezoneDisplayProps = {
  readonly timezone?: string | null;
  readonly showOffset?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: NonNullable<TypographyProps["variant"]>;
  /** Render shape: "label" (default) renders the textual label; "iconOnly" renders just the territory flag emoji. */
  readonly displayType?: "label" | "iconOnly";
  readonly sx?: SxProps<Theme>;
};

/**
 * Mobile-tier timezone display. Self-contained — no shared base.
 *
 * Differences vs desktop:
 * - Default `typographyVariant="caption"` (vs desktop `"bodyMd"`) for compact
 *   mobile typography.
 * - `whiteSpace: "nowrap"` preserved to keep timezone label on a single line.
 * - Supports `displayType="iconOnly"` for compact meta tiles where only the
 *   territory flag emoji is desired.
 */
export const MobileTimezoneDisplay: React.FC<MobileTimezoneDisplayProps> = ({
  timezone,
  showOffset = true,
  fallback,
  typographyVariant = "caption",
  displayType = "label",
  sx,
}): React.ReactNode => {
  const locale = useAppLocale();

  let content: React.ReactNode;
  if (!timezone) {
    content = fallback ?? null;
  } else {
    const normalizedTimezone = timezone.includes("/") ? timezone : fromGraphqlIanaTimezone(timezone);
    if (displayType === "iconOnly") {
      content = <MobileLocaleEmoji emoji={getTimezoneEmoji(normalizedTimezone)} sx={sx} />;
    } else {
      const display = showOffset
        ? getTimezoneSelectLabel(normalizedTimezone, locale)
        : getTimezonePathLabel(normalizedTimezone, locale);
      content = (
        <Typography component="span" variant={typographyVariant} sx={mergeSx({ whiteSpace: "nowrap" }, sx)}>
          {display}
        </Typography>
      );
    }
  }
  return content;
};
