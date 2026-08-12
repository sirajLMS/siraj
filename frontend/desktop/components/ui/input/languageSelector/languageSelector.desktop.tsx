"use client";

import type * as React from "react";
import {
  DEFAULT_LANGUAGE_SELECTOR_OPTION_SX,
  LanguageSelectorShared,
  type LanguageSelectorSharedProps,
} from "@/frontend/common/components/ui/input/languageSelector/LanguageSelectorShared";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";

export type LanguageSelectorProps = LanguageSelectorSharedProps;

export const LanguageSelectorDesktop: React.FC<LanguageSelectorProps> = (props): React.ReactNode => {
  return (
    <LanguageSelectorShared
      {...props}
      slots={{
        LocaleEmojiComponent: DesktopLocaleEmoji,
        optionBoxSx: DEFAULT_LANGUAGE_SELECTOR_OPTION_SX,
      }}
    />
  );
};
