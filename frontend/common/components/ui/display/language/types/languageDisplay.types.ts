// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/language/languageDisplay.{mobile,desktop}.tsx)
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import type { LanguageType } from "@/frontend/common/lib/locale";

export type LanguageDisplayProps = {
  readonly code?: string | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};
