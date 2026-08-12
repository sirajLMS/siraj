"use client";

import type { Theme } from "@mui/material/styles";
import { LocaleAdornmentSwitchShared } from "@/frontend/common/components/ui/input/localizedString/localeAdornmentSwitchShared";
import type { LocaleAdornmentSwitchProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";

const DESKTOP_OPTION_SX = { padding: (theme: Theme) => theme.spacing(1.5) };
const DESKTOP_POPOVER_PAPER_SX = { minWidth: 220 };
const DESKTOP_ANCHOR_ORIGIN = { vertical: "bottom", horizontal: "left" } as const;
const DESKTOP_TRANSFORM_ORIGIN = { vertical: "top", horizontal: "left" } as const;

export function LocaleAdornmentSwitchDesktop(props: Readonly<LocaleAdornmentSwitchProps>) {
  return (
    <LocaleAdornmentSwitchShared
      {...props}
      LocaleEmoji={DesktopLocaleEmoji}
      optionSx={DESKTOP_OPTION_SX}
      popoverPaperSx={DESKTOP_POPOVER_PAPER_SX}
      popoverAnchorOrigin={DESKTOP_ANCHOR_ORIGIN}
      popoverTransformOrigin={DESKTOP_TRANSFORM_ORIGIN}
    />
  );
}
