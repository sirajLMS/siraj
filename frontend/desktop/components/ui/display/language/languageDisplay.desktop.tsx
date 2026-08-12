"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { LanguageDisplay } from "@/frontend/common/components/ui/display/language/LanguageDisplay";
import type { LanguageType } from "@/frontend/common/lib/locale";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";

export type DesktopLanguageDisplayProps = {
  readonly code?: string | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
};

export const DesktopLanguageDisplay = ({
  code,
  language,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant = "bodyMd",
  sx,
}: DesktopLanguageDisplayProps): React.JSX.Element | null => {
  return (
    <LanguageDisplay
      code={code}
      language={language}
      showEmoji={showEmoji}
      showLabel={showLabel}
      fallback={fallback}
      typographyVariant={typographyVariant}
      sx={sx}
      EmojiComponent={DesktopLocaleEmoji}
      stackSx={{ flexWrap: "nowrap" }}
    />
  );
};
