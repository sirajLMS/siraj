"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display/localizedStringDisplay/LocalizedStringDisplay";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import type { LocalizedString } from "@/shared/types";

export type MobileLocalizedStringDisplayProps = {
  readonly value?: LocalizedString | null;
  readonly locale?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
  readonly onClick?: React.MouseEventHandler<HTMLElement>;
};

/**
 * Mobile-tier resolved-string-only display for a JSONB `LocalizedString` map.
 *
 * Delegates to the shared `LocalizedStringDisplay`, defaulting
 * `typographyVariant` to `"caption"` for compact mobile typography.
 */
export const MobileLocalizedStringDisplay: React.FC<MobileLocalizedStringDisplayProps> = ({
  typographyVariant = "caption",
  ...delegated
}): React.ReactNode => <LocalizedStringDisplay typographyVariant={typographyVariant} {...delegated} />;
