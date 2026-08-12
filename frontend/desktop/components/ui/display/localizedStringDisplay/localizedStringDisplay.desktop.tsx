"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display/localizedStringDisplay/LocalizedStringDisplay";
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
 * Delegates to the shared {@link LocalizedStringDisplay} with a desktop default
 * `typographyVariant` of `"bodyMd"`.
 */
export const DesktopLocalizedStringDisplay: React.FC<DesktopLocalizedStringDisplayProps> = ({
  value,
  locale,
  fallback,
  typographyVariant = "bodyMd",
  sx,
  onClick,
}): React.ReactNode => {
  return (
    <LocalizedStringDisplay
      value={value}
      locale={locale}
      fallback={fallback}
      typographyVariant={typographyVariant}
      sx={sx}
      onClick={onClick}
    />
  );
};
