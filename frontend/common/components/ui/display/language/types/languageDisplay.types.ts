// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/language/languageDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";
import type { LanguageType } from "@/frontend/common/lib/locale";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type LanguageDisplayProps = {
  readonly code?: AppLanguage | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};
