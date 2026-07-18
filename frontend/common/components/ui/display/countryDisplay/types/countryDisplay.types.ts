// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/countryDisplay/countryDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import type { CountryType } from "@/frontend/common/lib/locale";

export type CountryDisplayProps = {
  readonly code?: string | null;
  readonly country?: CountryType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};
