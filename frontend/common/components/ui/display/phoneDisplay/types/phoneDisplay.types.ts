// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/phoneDisplay/phoneDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import type * as React from "react";

export type PhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};
