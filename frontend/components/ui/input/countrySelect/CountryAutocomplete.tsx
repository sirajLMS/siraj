"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useState } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import { CountryOptionRow, getCountryOptionLabel } from "@/frontend/components/ui/input/countrySelect/CountryOptionRow";
import {
  getCountryAutocompletePaperSlotProps,
  getCountryAutocompletePopperSlotProps,
} from "@/frontend/components/ui/input/countrySelect/countryAutocompletePopper";
import { type CountryType, countries } from "@/frontend/lib/locale";

export type CountryAutocompleteProps = {
  readonly country?: CountryType;
  readonly onChangeAction: (country: CountryType) => void;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  readonly showPhonePrefix?: boolean;
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
};

export const CountryAutocomplete: React.FC<CountryAutocompleteProps> = ({
  country,
  onChangeAction,
  autoComplete = "country",
  fullWidth,
  required,
  disabled,
  label,
  error,
  helperText,
  onBlurAction: onBlur,
  style,
  open: openProp,
  onOpenAction,
  onCloseAction,
  autoFocus,
  showPhonePrefix = true,
  matchAnchorWidth = true,
  disablePortal = false,
  listAttached = false,
}: CountryAutocompleteProps): React.ReactNode => {
  const t = useTranslations("ui.countrySelect");
  const locale = useLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const getOptionLabel = useCallback(
    (option: CountryType) => getCountryOptionLabel(option, locale, showPhonePrefix),
    [locale, showPhonePrefix]
  );

  const showRequiredError = Boolean(required) && !country;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t("required") : undefined);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={countries}
      autoHighlight
      disabled={disabled}
      open={isOpen}
      onOpen={() => {
        if (openProp === undefined) {
          setInternalOpen(true);
        }
        onOpenAction?.();
      }}
      onClose={() => {
        if (openProp === undefined) {
          setInternalOpen(false);
        }
        onCloseAction?.();
      }}
      value={country ?? null}
      sx={{
        ...style,
        ...(listAttached && {
          "& .MuiOutlinedInput-root": {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            ...(isOpen && {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }),
          },
        }),
      }}
      onChange={(_, newValue) => {
        if (newValue) {
          onChangeAction(newValue);
        }
      }}
      onBlur={onBlur}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={getOptionLabel}
      slotProps={{
        popper: getCountryAutocompletePopperSlotProps({
          matchAnchorWidth,
          disablePortal: disablePortal || listAttached,
          listAttached,
        }),
        paper: getCountryAutocompletePaperSlotProps(listAttached),
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={{ px: 2, py: 1 }} {...optionProps}>
            <CountryOptionRow country={option} locale={locale} showPhonePrefix={showPhonePrefix} />
          </Box>
        );
      }}
      renderInput={params => {
        const resolvedLabel = listAttached ? undefined : (label ?? t("selectCountry"));
        const resolvedPlaceholder = listAttached ? (label ?? t("selectCountry")) : undefined;

        return (
          <TextField
            {...params}
            label={resolvedLabel}
            placeholder={resolvedPlaceholder}
            required={required}
            error={showError}
            helperText={resolvedHelperText}
            onBlur={onBlur}
            autoFocus={autoFocus}
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
        );
      }}
    />
  );
};
