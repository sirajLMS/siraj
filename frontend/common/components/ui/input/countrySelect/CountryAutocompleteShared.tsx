"use client";

import Autocomplete, { type AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { useCallback, useState } from "react";
import {
  getCountryAutocompletePaperSlotProps,
  getCountryAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/countrySelect/countryAutocompletePopper";
import { getCountryOptionLabel } from "@/frontend/common/components/ui/input/countrySelect/countryOptionRow.utils";
import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import type { CountryAutocompleteSlots } from "@/frontend/common/components/ui/input/countrySelect/types/countryAutocompleteShared.types";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

const buildSxProp = (
  style: React.CSSProperties | undefined,
  listAttached: boolean,
  isOpen: boolean
): React.CSSProperties => ({
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
});

interface RenderInputConfig {
  readonly params: AutocompleteRenderInputParams;
  readonly listAttached: boolean;
  readonly label: string | undefined;
  readonly selectCountryLabel: string;
  readonly required: boolean | undefined;
  readonly showError: boolean;
  readonly helperText: string | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly autoFocus: boolean | undefined;
  readonly autoComplete: string;
  readonly country: CountryType | null | undefined;
  readonly LocaleEmoji: React.ComponentType<{ readonly emoji: string; readonly sx?: SxProps<Theme> }>;
}

function renderCountryInput(config: RenderInputConfig): React.ReactNode {
  const {
    params,
    listAttached,
    label,
    selectCountryLabel,
    required,
    showError,
    helperText,
    onBlur,
    autoFocus,
    autoComplete,
    country,
    LocaleEmoji,
  } = config;

  const resolvedLabel = listAttached ? undefined : (label ?? selectCountryLabel);
  const resolvedPlaceholder = listAttached ? (label ?? selectCountryLabel) : undefined;

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    params.slotProps.htmlInput?.onBlur?.(event);
    onBlur?.();
  };

  return (
    <TextField
      {...params}
      autoFocus={autoFocus}
      label={resolvedLabel}
      placeholder={resolvedPlaceholder}
      required={required}
      error={showError}
      helperText={helperText}
      onBlur={handleBlur}
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
}

export function CountryAutocompleteShared({
  country,
  onChangeAction,
  onClearAction,
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
  slots,
}: Readonly<CountryAutocompleteProps> & {
  readonly slots: CountryAutocompleteSlots;
}): React.ReactNode {
  const { LocaleEmoji, CountryOptionRow, optionBoxSx } = slots;
  const t = useAppTranslation(Translation.Ui.CountrySelect);
  const locale = useAppLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const getOptionLabel = useCallback(
    (option: CountryType) => getCountryOptionLabel(option, locale, showPhonePrefix),
    [locale, showPhonePrefix]
  );

  const showRequiredError = Boolean(required) && !country;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);

  const handleOpen = useCallback(() => {
    if (openProp === undefined) setInternalOpen(true);
    onOpenAction?.();
  }, [openProp, onOpenAction]);

  const handleClose = useCallback(() => {
    if (openProp === undefined) setInternalOpen(false);
    onCloseAction?.();
  }, [openProp, onCloseAction]);

  return (
    <Autocomplete
      open={isOpen}
      fullWidth={fullWidth}
      options={countries}
      autoHighlight
      disabled={disabled}
      onOpen={handleOpen}
      onClose={handleClose}
      value={country ?? null}
      sx={buildSxProp(style, listAttached, isOpen)}
      onChange={(_, newValue) => {
        if (newValue) {
          onChangeAction(newValue);
        } else if (onClearAction) {
          onClearAction();
        }
      }}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={getOptionLabel}
      slotProps={{
        popper: getCountryAutocompletePopperSlotProps({
          matchAnchorWidth,
          disablePortal,
          listAttached,
        }),
        paper: getCountryAutocompletePaperSlotProps(listAttached),
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={optionBoxSx} {...optionProps}>
            <CountryOptionRow country={option} locale={locale} showPhonePrefix={showPhonePrefix} />
          </Box>
        );
      }}
      renderInput={params =>
        renderCountryInput({
          params,
          listAttached,
          label,
          selectCountryLabel: t.selectCountry,
          required,
          showError,
          helperText: resolvedHelperText,
          onBlur,
          autoFocus,
          autoComplete,
          country,
          LocaleEmoji,
        })
      }
    />
  );
}
