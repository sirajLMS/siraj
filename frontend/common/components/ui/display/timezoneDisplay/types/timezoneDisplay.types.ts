// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/timezoneDisplay/timezoneDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";

/**
 * Shared input shape for the timezone display primitive. The mobile tier
 * extends this with a `displayType` discriminator that the desktop tier
 * does not render — see `MobileTimezoneDisplayProps` for the variant.
 */
export type BaseTimezoneDisplayProps = {
  readonly timezone?: string | null;
  readonly showOffset?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};
