"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import {
  CurrencyOptionRow,
  getCurrencyOptionRowLabel,
} from "@/frontend/components/ui/input/currencySelect/CurrencyOptionRow";
import {
  getCurrencyAutocompletePaperSlotProps,
  getCurrencyAutocompletePopperSlotProps,
} from "@/frontend/components/ui/input/currencySelect/currencyAutocompletePopper";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode, getCurrencyOptions, getCurrencySymbol } from "@/frontend/lib/currency";

export type CurrencyAutocompleteProps = {
  readonly currency?: CurrencyOption | null;
  readonly onChangeAction: (currency: CurrencyOption) => void;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  /**
   * Filter the visible options to a subset of ISO 4217 codes.
   */
  readonly allowedCodes?: readonly CurrencyCode[];
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
  readonly showSymbol?: boolean;
};

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
}: RenderInputParams): React.ReactNode => {
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
          startAdornment: (
            <>
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
              {currency ? (
                <InputAdornment position="start">
                  <LocaleEmoji emoji={currency.flagEmoji} />
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
};

const renderCurrencyOption = ({ props, option, locale, showSymbol }: RenderOptionParams): React.ReactNode => {
  const { key, ...optionProps } = props;
  return (
    <Box key={key} component="li" sx={{ px: 2, py: 1 }} {...optionProps}>
      <CurrencyOptionRow currency={option} locale={locale} showSymbol={showSymbol} />
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

export const CurrencyAutocomplete: React.FC<CurrencyAutocompleteProps> = ({
  currency,
  onChangeAction,
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
  matchAnchorWidth = true,
  disablePortal = false,
  listAttached = false,
  showSymbol = true,
}: CurrencyAutocompleteProps): React.ReactNode => {
  const t = useTranslations("ui.currencySelect");
  const locale = useLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const allOptions = useMemo(() => getCurrencyOptions(), []);
  const options = useMemo(() => {
    if (!allowedCodes || allowedCodes.length === 0) {
      return allOptions;
    }
    return allOptions.filter(option => allowedCodes.includes(option.code));
  }, [allOptions, allowedCodes]);

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
      }
    },
    [onChangeAction]
  );

  const showRequiredError = Boolean(required) && !currency;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t("required") : undefined);
  const resolvedLabel = listAttached ? undefined : (label ?? t("selectCurrency"));
  const resolvedPlaceholder = listAttached ? (label ?? t("selectCurrency")) : (placeholder ?? t("searchByCodeOrName"));

  return (
    <Autocomplete<CurrencyOption, false, false, false>
      fullWidth={fullWidth}
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
        popper: getCurrencyAutocompletePopperSlotProps({
          matchAnchorWidth,
          disablePortal: disablePortal || listAttached,
          listAttached,
        }),
        paper: getCurrencyAutocompletePaperSlotProps(listAttached),
      }}
      renderOption={(props, option) => renderCurrencyOption({ props, option, locale, showSymbol })}
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
        })
      }
    />
  );
};

export type { CurrencyCode, CurrencyOption };
export { getCurrencyByCode };
