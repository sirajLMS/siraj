"use client";

import { ArrowDropDown } from "@mui/icons-material";
import { Box, IconButton, Popover, Stack, styled } from "@mui/material";
import type { PopoverOrigin as MuiPopoverOrigin } from "@mui/material/Popover";
import type { SxProps, Theme } from "@mui/material/styles";
import { useCallback, useState } from "react";
import type { LocaleEmojiComponentProps } from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared";
import type { LocaleAdornmentSwitchProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { getLanguageDisplayName, getLanguageEmoji, languages } from "@/frontend/common/lib/locale";
import type { AppLocale } from "@/shared/i18n/routing";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Slot Types
// ---------------------------------------------------------------------------

export type PopoverOrigin = MuiPopoverOrigin;

export type LocaleAdornmentSwitchSlotProps = {
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
  /** Extra sx applied to each language-option row (tier-specific padding/minHeight). */
  readonly optionSx?: SxProps<Theme>;
  readonly popoverPaperSx?: SxProps<Theme>;
  readonly popoverAnchorOrigin: PopoverOrigin;
  readonly popoverTransformOrigin: PopoverOrigin;
};

// ---------------------------------------------------------------------------
// Styled base — shared styles between tiers (gap, hover, selected, border)
// ---------------------------------------------------------------------------

const BaseLanguageOption = styled(Box, {
  shouldForwardProp: prop => prop !== "isSelected" && prop !== "isLastItem",
})<{ readonly isSelected: boolean; readonly isLastItem: boolean }>(({ theme, isSelected, isLastItem }) => ({
  cursor: "pointer",
  transition: theme.transitions.create("background-color", {
    duration: 200,
    easing: theme.transitions.easing.easeInOut,
  }),
  backgroundColor: isSelected ? theme.palette.action.selected : "transparent",
  borderBottom: isLastItem ? "none" : `1px solid ${theme.palette.outlineVariant}`,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

// ---------------------------------------------------------------------------
// Sub-Components (shared presentation — accept slot props)
// ---------------------------------------------------------------------------

type LocaleListProps = {
  readonly activeLocale: AppLocale;
  readonly ariaLabel?: string;
  readonly onPick: (locale: AppLocale) => void;
  readonly uiLocale: AppLocale;
  readonly selectLocaleLabel: string;
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
  readonly optionSx?: SxProps<Theme>;
};

function LocaleList({
  activeLocale,
  ariaLabel,
  onPick,
  uiLocale,
  selectLocaleLabel,
  LocaleEmoji,
  optionSx,
}: Readonly<LocaleListProps>) {
  return (
    <Stack component="ul" aria-label={ariaLabel ?? selectLocaleLabel}>
      {languages.map((language, index, array) => {
        const isSelected = (language.code as string) === activeLocale;
        const isLastItem = index === array.length - 1;
        return (
          <BaseLanguageOption
            key={language.code}
            aria-selected={isSelected}
            isSelected={isSelected}
            isLastItem={isLastItem}
            onClick={() => onPick(language.code)}
            sx={optionSx}
          >
            <LocaleEmoji emoji={language.emoji} />
            <Box component="span" sx={{ flex: 1, fontSize: "0.875rem" }}>
              {getLanguageDisplayName(language.code, uiLocale)}
            </Box>
            {isSelected ? (
              <Box
                aria-hidden={true}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: theme => theme.palette.primary.main,
                }}
              />
            ) : null}
          </BaseLanguageOption>
        );
      })}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Scaffold Component
// ---------------------------------------------------------------------------

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
      <IconButton
        aria-label={ariaLabel ?? t.selectLocale}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={handleOpen}
        size="small"
        sx={[
          {
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            padding: 0.5,
            flexShrink: 0,
            borderRadius: 1,
            "&:hover": { backgroundColor: theme => theme.palette.action.hover },
          },
          variant === "adornment" && {
            marginInlineEnd: 0.5,
          },
          successSwitch && {
            color: theme => theme.palette.success.main,
            backgroundColor: theme => theme.palette.success.main,
          },
        ]}
      >
        <LocaleEmoji emoji={emoji} />
        {compact ? null : (
          <Box component="span" sx={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}>
            {label}
          </Box>
        )}
        <ArrowDropDown fontSize="small" />
      </IconButton>
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
