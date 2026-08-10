// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/localizedStringDisplay/localizedStringDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import type { LocalizedString } from "@/shared/types";

export type LocalizedStringDisplayProps = {
  readonly value?: LocalizedString | null;
  readonly locale?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
  readonly onClick?: React.MouseEventHandler<HTMLElement>;
};
