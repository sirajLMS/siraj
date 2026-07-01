"use client";

import { TranslateOutlined } from "@mui/icons-material";
import { Paper, type PaperProps, Popover, Stack, styled, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLanguageSwitch } from "@/frontend/hooks/useLanguageSwitch";
import type { Locale } from "@/shared/i18n/routing";
import { NavbarIcon } from "./NavbarIcon";

// --- Styled Components ---

/**
 * A styled wrapper for the language list menu items.
 * Handles background shifts, transitions, and conditional borders.
 */
interface LanguageOptionProps extends PaperProps {
  isSelected: boolean;
  isLastItem: boolean;
}

const LanguageOption = styled(Paper, {
  shouldForwardProp: prop => prop !== "isSelected" && prop !== "isLastItem",
})<LanguageOptionProps>(({ theme, isSelected, isLastItem }) => ({
  padding: theme.spacing(1.5),
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  backgroundColor: isSelected ? theme.palette.action.selected : theme.palette.background.paper,
  borderBottom: isLastItem ? "none" : "1px solid",
  borderColor: theme.palette.outlineVariant,

  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

/**
 * Ensures the text contents inside the option align neatly.
 */
const LanguageOptionLayout = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1.5), // replaces spacing={1.5} on the old Stack
}));

/**
 * Standardizes the minimum width and size of the short code (e.g., "EN", "AR").
 */
const ShortLabel = styled(Typography)(({ theme }) => ({
  minWidth: "32px",
  fontSize: theme.typography.bodyMd.fontSize,
}));

// --- Main Component ---

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const { currentLocale, switchLanguage, isPending } = useLanguageSwitch();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const languages: Array<{ code: Locale; label: string; shortLabel: string }> = [
    { code: "ar", label: t("langAr"), shortLabel: t("langArShort") },
    { code: "en", label: t("langEn"), shortLabel: t("langEnShort") },
  ];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (locale: Locale) => {
    switchLanguage(locale);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <NavbarIcon tooltipTitle={t("languageTooltip")} onClick={handleClick} disabled={isPending}>
        <TranslateOutlined />
      </NavbarIcon>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        disableAutoFocus
      >
        <Stack>
          {languages.map((option, index, array) => {
            const isSelected = currentLocale === option.code;
            const isLastItem = index === array.length - 1;

            return (
              <LanguageOption
                key={option.code}
                onClick={() => {
                  handleLanguageChange(option.code);
                }}
                elevation={0}
                square
                isSelected={isSelected}
                isLastItem={isLastItem}
              >
                <LanguageOptionLayout>
                  <ShortLabel>{option.shortLabel}</ShortLabel>
                  <Typography>{option.label}</Typography>
                </LanguageOptionLayout>
              </LanguageOption>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
}
