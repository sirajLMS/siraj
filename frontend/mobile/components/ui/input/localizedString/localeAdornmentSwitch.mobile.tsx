"use client";

import type { Theme } from "@mui/material/styles";
import { LocaleAdornmentSwitchShared } from "@/frontend/common/components/ui/input/localizedString/localeAdornmentSwitchShared";
import type { LocaleAdornmentSwitchProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";

const MOBILE_OPTION_SX = { padding: (theme: Theme) => theme.spacing(2), minHeight: 48 };
const MOBILE_POPOVER_PAPER_SX = { minWidth: "min(100vw - 32px, 320px)" };
const MOBILE_ANCHOR_ORIGIN = { vertical: "bottom", horizontal: "center" } as const;
const MOBILE_TRANSFORM_ORIGIN = { vertical: "top", horizontal: "center" } as const;

export function LocaleAdornmentSwitchMobile(props: Readonly<LocaleAdornmentSwitchProps>) {
  return (
    <LocaleAdornmentSwitchShared
      {...props}
      LocaleEmoji={MobileLocaleEmoji}
      optionSx={MOBILE_OPTION_SX}
      popoverPaperSx={MOBILE_POPOVER_PAPER_SX}
      popoverAnchorOrigin={MOBILE_ANCHOR_ORIGIN}
      popoverTransformOrigin={MOBILE_TRANSFORM_ORIGIN}
    />
  );
}
