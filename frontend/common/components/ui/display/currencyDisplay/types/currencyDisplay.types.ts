// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/currencyDisplay/CurrencyDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type { CurrencyDisplayPartValue } from "@/frontend/common/components/ui/display/currencyDisplay/constants";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";

export type CurrencyDisplayProps = {
  readonly code?: CurrencyCode | string | null;
  /**
   * Which currency ingredients to render. Order in the array is ignored;
   * parts always render as flag → label → symbol → code.
   *
   * When omitted or empty, defaults to flag + symbol.
   */
  readonly parts?: readonly CurrencyDisplayPartValue[];
  readonly fallback?: string;
  /** Wider than `TypographyProps["variant"]` to admit custom theme variants like `bodySm`. */
  readonly typographyVariant?: UiTypographyVariantLoose;
  readonly sx?: SxProps<Theme>;
};
