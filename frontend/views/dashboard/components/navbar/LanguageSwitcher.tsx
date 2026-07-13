"use client";

import { TranslateOutlined } from "@mui/icons-material";
import { Paper, type PaperProps, Popover, Stack, styled } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageDisplay } from "@/frontend/components/ui/display";
import { useLanguageSwitch } from "@/frontend/common/hooks/useLanguageSwitch";
import { languages } from "@/frontend/common/lib/locale";
import { NavbarIcon } from "@/frontend/views/dashboard/components/navbar/NavbarIcon";
import type { Locale } from "@/shared/i18n/routing";

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
  gap: theme.spacing(1.5),
}));

// --- Main Component ---

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const { currentLocale, switchLanguage, isPending } = useLanguageSwitch();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (nextLocale: Locale) => {
    switchLanguage(nextLocale);
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
          {languages.map((language, index, array) => {
            const isSelected = currentLocale === language.code;
            const isLastItem = index === array.length - 1;

            return (
              <LanguageOption
                key={language.code}
                onClick={() => {
                  handleLanguageChange(language.code);
                }}
                elevation={0}
                square
                isSelected={isSelected}
                isLastItem={isLastItem}
              >
                <LanguageOptionLayout>
                  <LanguageDisplay
                    language={language}
                    typographyVariant="bodyMd"
                    sx={{ "& > span": { fontSize: "1.25rem" } }}
                  />
                </LanguageOptionLayout>
              </LanguageOption>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
}
