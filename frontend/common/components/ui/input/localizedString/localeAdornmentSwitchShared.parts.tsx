"use client";

import { ArrowDropDown } from "@mui/icons-material";
import { Box, IconButton, Stack, styled } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { LocaleEmojiComponentProps } from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared";
import { getLanguageDisplayName, languages } from "@/frontend/common/lib/locale";
import type { AppLocale } from "@/shared/i18n/routing";

const BaseLanguageOption = styled("li", {
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
  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: "-2px",
  },
}));

export type LocaleListProps = {
  readonly activeLocale: AppLocale;
  readonly ariaLabel?: string;
  readonly onPick: (locale: AppLocale) => void;
  readonly uiLocale: AppLocale;
  readonly selectLocaleLabel: string;
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
  readonly optionSx?: SxProps<Theme>;
};

export function LocaleList({
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
            tabIndex={0}
            aria-current={isSelected ? "true" : undefined}
            isSelected={isSelected}
            isLastItem={isLastItem}
            onClick={() => onPick(language.code)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPick(language.code);
              }
            }}
            sx={optionSx}
          >
            <LocaleEmoji emoji={language.emoji} />
            <Box component="span" sx={theme => ({ flex: 1, fontSize: theme.typography.bodyMd.fontSize })}>
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

export type LocaleTriggerButtonProps = {
  readonly ariaLabel: string;
  readonly expanded: boolean;
  readonly disabled: boolean;
  readonly onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly showCompact: boolean;
  readonly isAdornment: boolean;
  readonly successSwitch: boolean;
  readonly emoji: string;
  readonly label: string;
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
};

export function LocaleTriggerButton({
  ariaLabel,
  expanded,
  disabled,
  onClick,
  showCompact,
  isAdornment,
  successSwitch,
  emoji,
  label,
  LocaleEmoji,
}: Readonly<LocaleTriggerButtonProps>) {
  return (
    <IconButton
      aria-label={ariaLabel}
      aria-expanded={expanded}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={onClick}
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
        isAdornment && {
          marginInlineEnd: 0.5,
        },
        successSwitch && {
          color: theme => theme.palette.success.main,
          backgroundColor: theme => theme.palette.success.main,
        },
      ]}
    >
      <LocaleEmoji emoji={emoji} />
      {showCompact ? null : (
        <Box component="span" sx={theme => ({ whiteSpace: "nowrap", fontSize: theme.typography.bodyMd.fontSize })}>
          {label}
        </Box>
      )}
      <ArrowDropDown fontSize="small" />
    </IconButton>
  );
}
