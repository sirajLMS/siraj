"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import { getLanguageDisplayName, type LanguageType, languages } from "@/frontend/lib/locale";

export type LanguageSelectorProps = {
  language?: LanguageType;
  setLanguageAction: (language: LanguageType) => void;
  fullWidth?: boolean;
  required?: boolean;
  label?: string;
  style?: React.CSSProperties;
};

/**
 * LanguageSelector component allows users to select a language from a dropdown list.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  setLanguageAction: setLanguage,
  fullWidth,
  required,
  label,
  style,
}: LanguageSelectorProps): React.ReactNode => {
  const t = useTranslations("ui.languageSelector");
  const locale = useLocale();

  const getLanguageName = useCallback((code: string) => getLanguageDisplayName(code, locale), [locale]);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={languages}
      autoHighlight
      value={language ?? null}
      sx={{ ...style }}
      onChange={(_, newValue) => {
        if (newValue) {
          setLanguage(newValue);
        }
      }}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={option => getLanguageName(option.code)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }} {...optionProps}>
            <LocaleEmoji emoji={option.emoji} />
            {getLanguageName(option.code)}
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label ?? t("selectLanguage")}
          required={required}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: language ? (
                <>
                  <InputAdornment position="start">
                    <LocaleEmoji emoji={language.emoji} />
                  </InputAdornment>
                  {params.slotProps.input?.startAdornment}
                </>
              ) : (
                params.slotProps.input?.startAdornment
              ),
            },
          }}
        />
      )}
    />
  );
};
