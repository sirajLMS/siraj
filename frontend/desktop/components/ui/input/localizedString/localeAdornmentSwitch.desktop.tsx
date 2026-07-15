"use client";

import { ArrowDropDown } from "@mui/icons-material";
import { Box, IconButton, Popover, Stack, styled, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";
import type { LocaleAdornmentSwitchProps } from "@/frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch";
import { getLanguageDisplayName, getLanguageEmoji, languages } from "@/frontend/common/lib/locale";
import type { AppLocale } from "@/shared/i18n/routing";
import { useAppLocale, useAppTranslation } from "@/shared/locale/client";

type DesktopLocaleListProps = {
  readonly activeLocale: AppLocale;
  readonly ariaLabel?: string;
  readonly onPick: (locale: AppLocale) => void;
};

const DesktopLanguageOption = styled(Box, {
  shouldForwardProp: prop => prop !== "isSelected" && prop !== "isLastItem",
})<{ readonly isSelected: boolean; readonly isLastItem: boolean }>(({ theme, isSelected, isLastItem }) => ({
  padding: theme.spacing(1.5),
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

function DesktopLocaleList({ activeLocale, ariaLabel, onPick }: Readonly<DesktopLocaleListProps>) {
  const t = useAppTranslation("ui.localizedString");
  const uiLocale = useAppLocale();

  return (
    <Stack role="listbox" aria-label={ariaLabel ?? t("selectLocale")}>
      {languages.map((language, index, array) => {
        const isSelected = language.code === activeLocale;
        const isLastItem = index === array.length - 1;
        return (
          <DesktopLanguageOption
            key={language.code}
            role="option"
            aria-selected={isSelected}
            isSelected={isSelected}
            isLastItem={isLastItem}
            onClick={() => onPick(language.code as AppLocale)}
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
          </DesktopLanguageOption>
        );
      })}
    </Stack>
  );
}

export function LocaleAdornmentSwitchDesktop({
  activeLocale,
  onChangeAction,
  disabled = false,
  variant = "adornment",
  compact = false,
  successSwitch = false,
  ariaLabel,
}: LocaleAdornmentSwitchProps) {
  const t = useAppTranslation("ui.localizedString");
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
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableAutoFocus
        slotProps={{
          paper: {
            sx: { minWidth: 220 },
          },
        }}
      >
        <DesktopLocaleList activeLocale={activeLocale} ariaLabel={ariaLabel} onPick={handlePick} />
      </Popover>
    </>
  );
}
