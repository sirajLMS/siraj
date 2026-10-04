"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import type Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import type {
  CurrencyOptionRowComponent,
  LocaleEmojiComponent,
} from "@/frontend/common/components/ui/input/currencySelect/types/currencyAutocompleteShared.types";
import { type CurrencyOption, getCurrencySymbol } from "@/frontend/common/lib/currency";

type RenderInputParams = {
  readonly params: Parameters<
    NonNullable<React.ComponentProps<typeof Autocomplete<CurrencyOption, false, false, false>>["renderInput"]>
  >[0];
  readonly resolvedLabel: string | undefined;
  readonly resolvedPlaceholder: string | undefined;
  readonly required: boolean | undefined;
  readonly showError: boolean;
  readonly resolvedHelperText: string | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly autoFocus: boolean | undefined;
  readonly autoComplete: string;
  readonly currency: CurrencyOption | null | undefined;
  readonly showSymbol: boolean;
  readonly LocaleEmojiComponent: LocaleEmojiComponent;
};

export const renderCurrencyInput = ({
  params,
  resolvedLabel,
  resolvedPlaceholder,
  required,
  showError,
  resolvedHelperText,
  onBlur,
  autoFocus,
  autoComplete,
  currency,
  showSymbol,
  LocaleEmojiComponent,
}: RenderInputParams): React.ReactNode => {
  return (
    <TextField
      {...params}
      autoFocus={autoFocus}
      label={resolvedLabel}
      placeholder={resolvedPlaceholder}
      required={required}
      error={showError}
      helperText={resolvedHelperText}
      onBlur={onBlur}
      slotProps={{
        ...params.slotProps,
        input: {
          ...params.slotProps.input,
          startAdornment: (
            <>
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
              {currency ? (
                <InputAdornment position="start">
                  <LocaleEmojiComponent emoji={currency.flagEmoji} />
                </InputAdornment>
              ) : null}
              {params.slotProps.input?.startAdornment}
            </>
          ),
          endAdornment: currency ? (
            <>
              {params.slotProps.input?.endAdornment}
              <InputAdornment position="end">
                <Box
                  component="span"
                  sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, direction: "ltr" })}
                >
                  {showSymbol ? getCurrencySymbol(currency.code) : (currency.code as string)}
                </Box>
              </InputAdornment>
            </>
          ) : (
            params.slotProps.input?.endAdornment
          ),
        },
        htmlInput: {
          ...params.slotProps.htmlInput,
          autoComplete,
        },
      }}
    />
  );
};

type RenderOptionParams = {
  readonly props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
  readonly option: CurrencyOption;
  readonly locale: string;
  readonly showSymbol: boolean;
  readonly OptionRowComponent: CurrencyOptionRowComponent;
  readonly optionRowSx: SxProps<Theme> | undefined;
};

export const renderCurrencyOption = ({
  props,
  option,
  locale,
  showSymbol,
  OptionRowComponent,
  optionRowSx,
}: RenderOptionParams): React.ReactNode => {
  const { key, ...optionProps } = props;
  return (
    <Box key={key} component="li" sx={optionRowSx} {...optionProps}>
      <OptionRowComponent currency={option} locale={locale} showSymbol={showSymbol} />
    </Box>
  );
};
