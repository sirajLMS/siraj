// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/countryDisplay/countryDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type { CountryType } from "@/frontend/common/lib/locale";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type CountryDisplayProps = {
  readonly code?: string | null;
  readonly country?: CountryType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};
