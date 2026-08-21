"use client";

import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";
import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";
import { getLanguageDisplayName, getLanguageEmoji, type LanguageType } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

type LocaleEmojiComponentType = typeof LocaleEmoji;

export type LanguageDisplayProps = {
  readonly code?: AppLanguage | null;
  readonly language?: LanguageType;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly sx?: SxProps<Theme>;
  /** Slot for the emoji component (defaults to common `LocaleEmoji`). */
  readonly EmojiComponent?: LocaleEmojiComponentType;
  /** Extra sx to merge into the Stack container (e.g. `flexWrap: "nowrap"`). */
  readonly stackSx?: SxProps<Theme>;
};

export const LanguageDisplay = ({
  code,
  language,
  showEmoji = true,
  showLabel = true,
  fallback,
  typographyVariant,
  sx,
  EmojiComponent = LocaleEmoji,
  stackSx,
}: LanguageDisplayProps): React.JSX.Element | null => {
  const locale = useAppLocale();
  const fallbackNode = fallback ? (
    <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
      {fallback}
    </Typography>
  ) : null;

  const resolvedCode = language?.code ?? code;
  if (!resolvedCode) {
    return fallbackNode;
  }

  const emoji = language?.emoji ?? getLanguageEmoji(resolvedCode);
  const name = getLanguageDisplayName(resolvedCode, locale);

  return (
    <Stack direction="row" spacing={1} sx={mergeSx({ alignItems: "center" }, stackSx, sx)}>
      {showEmoji && <EmojiComponent emoji={emoji} />}
      {showLabel && (
        <Typography variant={typographyVariant} sx={{ whiteSpace: "nowrap" }}>
          {name}
        </Typography>
      )}
    </Stack>
  );
};
