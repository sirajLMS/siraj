"use client";

import { ArrowDropDown } from "@mui/icons-material";
import {
  Box,
  type BoxProps,
  IconButton,
  Popover,
  Stack,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display/localeEmoji/LocaleEmoji";
import { getLanguageDisplayName, getLanguageEmoji, languages } from "@/frontend/lib/locale";
import type { AppLocale } from "@/shared/i18n/routing";

export type LocaleAdornmentSwitchProps = {
  readonly activeLocale: AppLocale;
  readonly onChangeAction: (nextLocale: AppLocale) => void;
  /** Disable the switcher button (e.g. when the parent input is disabled). */
  readonly disabled?: boolean;
  /** Render variant: `adornment` for inline `TextField` start adornment, `standalone` for previews/Storybook. */
  readonly variant?: "adornment" | "standalone";
  /**
   * Compact layout for narrow viewports (`down("sm")`): flag + chevron only,
   * language name hidden. Parent sets this from `useMediaQuery`; not part of
   * the public form-field API.
   */
  readonly compact?: boolean;
  /** Visually indicate a successful commit immediately after switching (500ms green tint). */
  readonly successSwitch?: boolean;
  /** Optional aria label override; defaults to translated `selectLocale`. */
  readonly ariaLabel?: string;
};

interface LanguageOptionProps extends BoxProps {
  readonly isSelected: boolean;
  readonly isLastItem: boolean;
}

const LanguageOption = styled(Box, {
  shouldForwardProp: prop => prop !== "isSelected" && prop !== "isLastItem" && prop !== "isTouch",
})<LanguageOptionProps & { readonly isTouch?: boolean }>(({ theme, isSelected, isLastItem, isTouch }) => ({
  padding: theme.spacing(isTouch ? 2 : 1.5),
  minHeight: isTouch ? 48 : undefined,
  cursor: "pointer",
  transition: "background-color 0.2s ease-in-out",
  backgroundColor: isSelected ? theme.palette.action.selected : "transparent",
  borderBottom: isLastItem ? "none" : `1px solid ${theme.palette.outlineVariant}`,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

/**
 * Reusable start-adornment switcher for the localized-string inline input.
 *
 * Renders the active locale's flag (`LocaleEmoji`) + the language display
 * name in the UI locale. Clicking opens a small Popover listing every
 * `LanguageType` from `@/frontend/lib/locale` (mirrors the navbar
 * `LanguageSwitcher` pattern). Selecting a locale calls `onChangeAction`
 * — the parent is responsible for committing the draft before swapping.
 *
 * Adding a locale requires updating `routing.locales` +
 * `backend/enum/auth.enum.ts` (`AppLanguage`) +
 * `frontend/lib/locale/language/languages.ts`; this adornment then lists it
 * automatically.
 */
export const LocaleAdornmentSwitch: React.FC<LocaleAdornmentSwitchProps> = ({
  activeLocale,
  onChangeAction,
  disabled = false,
  variant = "adornment",
  compact = false,
  successSwitch = false,
  ariaLabel,
}) => {
  const t = useTranslations("ui.localizedString");
  const uiLocale = useLocale();
  const theme = useTheme();
  const isPopoverMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
        aria-label={ariaLabel ?? t("selectLocale")}
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
          <Typography component="span" sx={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}>
            {label}
          </Typography>
        )}
        <ArrowDropDown fontSize="small" />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isPopoverMobile ? "center" : "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isPopoverMobile ? "center" : "left",
        }}
        disableAutoFocus
        slotProps={{
          paper: {
            sx: {
              minWidth: isPopoverMobile ? "min(100vw - 32px, 320px)" : 220,
            },
          },
        }}
      >
        <Stack role="listbox" aria-label={ariaLabel ?? t("selectLocale")}>
          {languages.map((language, index, array) => {
            const isSelected = language.code === activeLocale;
            const isLastItem = index === array.length - 1;
            return (
              <LanguageOption
                key={language.code}
                role="option"
                aria-selected={isSelected}
                isSelected={isSelected}
                isLastItem={isLastItem}
                isTouch={isPopoverMobile}
                onClick={() => handlePick(language.code as AppLocale)}
              >
                <LocaleEmoji emoji={language.emoji} />
                <Typography component="span" sx={{ flex: 1, fontSize: "0.875rem" }}>
                  {getLanguageDisplayName(language.code, uiLocale)}
                </Typography>
                {isSelected ? (
                  <Box
                    aria-hidden
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: theme => theme.palette.primary.main,
                    }}
                  />
                ) : null}
              </LanguageOption>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
};
