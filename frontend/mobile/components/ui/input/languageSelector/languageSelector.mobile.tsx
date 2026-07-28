"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { useCallback } from "react";
import { getLanguageDisplayName, languages } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";
import type { LanguageSelectorProps } from "@/frontend/mobile/components/ui/input/languageSelector/LanguageSelector";
import { Translation, useAppTranslation } from "@/shared/locale";

export const LanguageSelectorMobile: React.FC<LanguageSelectorProps> = ({
  language,
  setLanguageAction: setLanguage,
  fullWidth,
  required,
  disabled,
  label,
  error,
  helperText,
  onBlurAction: onBlur,
  style,
}: LanguageSelectorProps): React.ReactNode => {
  const t = useAppTranslation(Translation.Ui.LanguageSelector);
  const locale = useAppLocale();

  const getLanguageName = useCallback((code: string) => getLanguageDisplayName(code, locale), [locale]);

  const showRequiredError = Boolean(required) && !language;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={languages}
      autoHighlight
      disabled={disabled}
      value={language ?? null}
      sx={{ ...style }}
      onChange={(_, newValue) => {
        if (newValue) {
          setLanguage(newValue);
        }
      }}
      onBlur={onBlur}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={option => getLanguageName(option.code)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box
            key={key}
            component="li"
            sx={{ display: "flex", alignItems: "center", py: 1.25, minHeight: 48, gap: 1.5 }}
            {...optionProps}
          >
            <MobileLocaleEmoji emoji={option.emoji} />
            {getLanguageName(option.code)}
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label ?? t.selectLanguage}
          required={required}
          error={showError}
          helperText={resolvedHelperText}
          slotProps={{
            ...params.slotProps,
            inputLabel: {
              ...params.slotProps.inputLabel,
              shrink: true,
            },
            input: {
              ...params.slotProps.input,
              startAdornment: language ? (
                <>
                  <InputAdornment position="start">
                    <MobileLocaleEmoji emoji={language.emoji} />
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
