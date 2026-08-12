"use client";

import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import {
  DEFAULT_LANGUAGE_SELECTOR_OPTION_SX,
  LanguageSelectorShared,
} from "@/frontend/common/components/ui/input/languageSelector/LanguageSelectorShared";
import type { LanguageType } from "@/frontend/common/lib/locale/language/types";

export type LanguageSelectorProps = {
  readonly language?: LanguageType;
  readonly setLanguageAction: (language: LanguageType) => void;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
};

/**
 * LanguageSelector component allows users to select a language from a dropdown list.
 * Common-tier variant — uses shared LocaleEmoji and default option spacing.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = (props): React.ReactNode => {
  return (
    <LanguageSelectorShared
      {...props}
      slots={{
        LocaleEmojiComponent: LocaleEmoji,
        optionBoxSx: DEFAULT_LANGUAGE_SELECTOR_OPTION_SX,
      }}
    />
  );
};
