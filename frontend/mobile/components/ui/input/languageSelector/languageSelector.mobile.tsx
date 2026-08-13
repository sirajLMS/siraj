"use client";

import type * as React from "react";
import type { LanguageSelectorProps } from "@/frontend/common/components/ui/input/languageSelector/LanguageSelector";
import { LanguageSelectorShared } from "@/frontend/common/components/ui/input/languageSelector/LanguageSelectorShared";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";

const MOBILE_OPTION_BOX_SX = { display: "flex", alignItems: "center", py: 1.25, minHeight: 48, gap: 1.5 } as const;

const MOBILE_INPUT_LABEL_SLOT_PROS = { shrink: true } as const;

export const LanguageSelectorMobile: React.FC<LanguageSelectorProps> = (props): React.ReactNode => {
  return (
    <LanguageSelectorShared
      {...props}
      slots={{
        LocaleEmojiComponent: MobileLocaleEmoji,
        optionBoxSx: MOBILE_OPTION_BOX_SX,
        inputLabelSlotProps: MOBILE_INPUT_LABEL_SLOT_PROS,
      }}
    />
  );
};
