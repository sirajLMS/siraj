// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/phoneDisplay/phoneDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type PhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};
