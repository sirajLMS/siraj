"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { getCurrencyOptionRowLabel } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.utils";
import type {
  CurrencyAutocompleteSharedProps,
  CurrencyOptionRowComponent,
  LocaleEmojiComponent,
} from "@/frontend/common/components/ui/input/currencySelect/types/currencyAutocompleteShared.types";
import { useCurrencyCatalog } from "@/frontend/common/hooks/useCurrencyCatalog";
import { type CurrencyOption, getCurrencySymbol } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

const filterOptions = createFilterOptions<CurrencyOption>({
  matchFrom: "any",
  stringify: option => `${option.code as string} ${option.symbol} ${getCurrencyOptionRowLabel(option, "en")}`,
});

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

const renderCurrencyInput = ({
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
                <Typography
                  component="span"
                  dir="ltr"
                  sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}
                >
                  {showSymbol ? getCurrencySymbol(currency.code) : (currency.code as string)}
                </Typography>
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

const renderCurrencyOption = ({
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

const buildAutocompleteSx = (
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

export const CurrencyAutocompleteShared: React.FC<CurrencyAutocompleteSharedProps> = ({
  currency,
  onChangeAction,
  onClearAction,
  autoComplete = "off",
  fullWidth,
  required,
  disabled,
  label,
  placeholder,
  error,
  helperText,
  onBlurAction: onBlur,
  style,
  open: openProp,
  onOpenAction,
  onCloseAction,
  autoFocus,
  allowedCodes,
  excludedCodes,
  matchAnchorWidth = true,
  disablePortal = false,
  listAttached = false,
  showSymbol = true,
  LocaleEmojiComponent,
  CurrencyOptionRowComponent,
  getPopperSlotProps,
  getPaperSlotProps,
  optionRowSx,
  fullWidthDefault,
}: Readonly<CurrencyAutocompleteSharedProps>): React.ReactNode => {
  const t = useAppTranslation(Translation.Ui.CurrencySelect);
  const locale = useAppLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const { options: allOptions, loaded: catalogLoaded } = useCurrencyCatalog();
  const options = useMemo(() => {
    if (!catalogLoaded && currency) {
      const selected = allOptions.find(opt => opt.code === currency.code);
      return selected ? [selected] : [];
    }
    let filtered = allOptions;
    if (allowedCodes && allowedCodes.length > 0) {
      filtered = filtered.filter(option => allowedCodes.includes(option.code));
    }
    if (excludedCodes && excludedCodes.length > 0) {
      // Keep the currently-selected currency visible even if it is excluded
      // (e.g. edit mode for an already-activated currency).
      filtered = filtered.filter(option => !excludedCodes.includes(option.code) || option.code === currency?.code);
    }
    return filtered;
  }, [allOptions, allowedCodes, excludedCodes, catalogLoaded, currency]);

  const getOptionLabel = useCallback((option: CurrencyOption) => getCurrencyOptionRowLabel(option, locale), [locale]);

  const handleOpen = useCallback(() => {
    if (openProp === undefined) {
      setInternalOpen(true);
    }
    onOpenAction?.();
  }, [openProp, onOpenAction]);

  const handleClose = useCallback(() => {
    if (openProp === undefined) {
      setInternalOpen(false);
    }
    onCloseAction?.();
  }, [openProp, onCloseAction]);

  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: CurrencyOption | null) => {
      if (newValue) {
        onChangeAction(newValue);
      } else if (onClearAction) {
        onClearAction();
      }
    },
    [onChangeAction, onClearAction]
  );

  const showRequiredError = Boolean(required) && !currency;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);
  const resolvedLabel = listAttached ? undefined : (label ?? t.selectCurrency);
  const resolvedPlaceholder = listAttached ? (label ?? t.selectCurrency) : (placeholder ?? t.searchByCodeOrName);
  const effectiveFullWidth = fullWidth ?? fullWidthDefault;

  return (
    <Autocomplete<CurrencyOption>
      fullWidth={effectiveFullWidth}
      options={options}
      autoHighlight
      disabled={disabled}
      open={isOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      value={currency ?? null}
      sx={buildAutocompleteSx(style, listAttached, isOpen)}
      onChange={handleChange}
      onBlur={onBlur}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={getOptionLabel}
      filterOptions={filterOptions}
      slotProps={{
        popper: getPopperSlotProps({
          matchAnchorWidth,
          disablePortal: disablePortal || listAttached,
          listAttached,
        }),
        paper: getPaperSlotProps(listAttached),
      }}
      renderOption={(props, option) =>
        renderCurrencyOption({
          props,
          option,
          locale,
          showSymbol,
          OptionRowComponent: CurrencyOptionRowComponent,
          optionRowSx,
        })
      }
      renderInput={params =>
        renderCurrencyInput({
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
        })
      }
    />
  );
};
