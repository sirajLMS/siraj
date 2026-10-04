"use client";

import { Popover } from "@mui/material";
import type { PopoverOrigin as MuiPopoverOrigin } from "@mui/material/Popover";
import type { SxProps, Theme } from "@mui/material/styles";
import { useCallback, useState } from "react";
import {
  LocaleList,
  LocaleTriggerButton,
} from "@/frontend/common/components/ui/input/localizedString/localeAdornmentSwitchShared.parts";
import type { LocaleEmojiComponentProps } from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared";
import type { LocaleAdornmentSwitchProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { getLanguageDisplayName, getLanguageEmoji } from "@/frontend/common/lib/locale";
import type { AppLocale } from "@/shared/i18n/routing";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

type PopoverOrigin = MuiPopoverOrigin;

export type LocaleAdornmentSwitchSlotProps = {
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
  /** Extra sx applied to each language-option row (tier-specific padding/minHeight). */
  readonly optionSx?: SxProps<Theme>;
  readonly popoverPaperSx?: SxProps<Theme>;
  readonly popoverAnchorOrigin: PopoverOrigin;
  readonly popoverTransformOrigin: PopoverOrigin;
};

export function LocaleAdornmentSwitchShared({
  activeLocale,
  onChangeAction,
  disabled = false,
  variant = "adornment",
  compact = false,
  successSwitch = false,
  ariaLabel,
  LocaleEmoji,
  optionSx,
  popoverPaperSx,
  popoverAnchorOrigin,
  popoverTransformOrigin,
}: LocaleAdornmentSwitchProps & LocaleAdornmentSwitchSlotProps) {
  const t = useAppTranslation(Translation.Ui.LocalizedString);
  const uiLocale = useAppLocale();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (disabled) {
        return;
      }
      setAnchorEl(event.currentTarget);
    },
    [disabled]
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handlePick = useCallback(
    (locale: AppLocale) => {
      if (locale === activeLocale) {
        handleClose();
        return;
      }
      onChangeAction(locale);
      handleClose();
    },
    [activeLocale, onChangeAction, handleClose]
  );

  const open = Boolean(anchorEl);
  const emoji = getLanguageEmoji(activeLocale);
  const label = getLanguageDisplayName(activeLocale, uiLocale);

  return (
    <>
      <LocaleTriggerButton
        ariaLabel={ariaLabel ?? t.selectLocale}
        expanded={open}
        disabled={disabled}
        onClick={handleOpen}
        showCompact={compact}
        isAdornment={variant === "adornment"}
        successSwitch={successSwitch}
        emoji={emoji}
        label={label}
        LocaleEmoji={LocaleEmoji}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={popoverAnchorOrigin}
        transformOrigin={popoverTransformOrigin}
        disableAutoFocus
        slotProps={{
          paper: {
            sx: popoverPaperSx,
          },
        }}
      >
        <LocaleList
          activeLocale={activeLocale}
          ariaLabel={ariaLabel}
          onPick={handlePick}
          uiLocale={uiLocale}
          selectLocaleLabel={t.selectLocale}
          LocaleEmoji={LocaleEmoji}
          optionSx={optionSx}
        />
      </Popover>
    </>
  );
}
