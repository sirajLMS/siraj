"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import { type CountryType, countries, getCountryDisplayName } from "@/frontend/lib/locale";

export type CountrySelectProps = {
  country?: CountryType;
  setCountryAction: (countryType: CountryType) => void;
  autoComplete?: string;
  fullWidth?: boolean;
  required?: boolean;
  label?: string;
  onBlurAction?: () => void;
  style?: React.CSSProperties;
};

/**
 * CountrySelect component allows users to select a country from a dropdown list.
 */
export const CountrySelect: React.FC<CountrySelectProps> = ({
  country,
  setCountryAction: setCountry,
  autoComplete = "country",
  fullWidth,
  required,
  label,
  onBlurAction: onBlur,
  style,
}: CountrySelectProps): React.ReactNode => {
  const t = useTranslations("ui.countrySelect");
  const locale = useLocale();

  const getCountryName = useCallback((code: string) => getCountryDisplayName(code, locale), [locale]);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={countries}
      autoHighlight
      value={country ?? null}
      sx={{ ...style }}
      onChange={(_, newValue) => {
        if (newValue) {
          setCountry(newValue);
        }
      }}
      onBlur={onBlur}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={option => getCountryName(option.code)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }} {...optionProps}>
            <LocaleEmoji emoji={option.emoji} />
            {getCountryName(option.code)}
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label ?? t("selectCountry")}
          required={required}
          onBlur={onBlur}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: country ? (
                <>
                  <InputAdornment position="start">
                    <LocaleEmoji emoji={country.emoji} />
                  </InputAdornment>
                  {params.slotProps.input?.startAdornment}
                </>
              ) : (
                params.slotProps.input?.startAdornment
              ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              autoComplete,
            },
          }}
        />
      )}
    />
  );
};
