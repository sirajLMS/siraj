"use client";

import Autocomplete from "@mui/material/Autocomplete";
import { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  CurrencyOptionRow,
  getCurrencyOptionRowLabel,
} from "@/frontend/components/ui/input/currencySelect/CurrencyOptionRow";
import {
  getCurrencyAutocompletePaperSlotProps,
  getCurrencyAutocompletePopperSlotProps,
} from "@/frontend/components/ui/input/currencySelect/currencyAutocompletePopper";
import { type CurrencyOption, getCurrencyByCode, getCurrencyOptions, getCurrencySymbol } from "@/frontend/lib/currency";

export type CurrencyAutocompleteProps = {
  readonly currency?: CurrencyOption | null;
  readonly onChangeAction: (currency: CurrencyOption) => void;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
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
  stringify: option =>
    `${option.code as string} ${option.symbol} ${getCurrencyOptionRowLabel(option, "en")}`,
});

export const CurrencyAutocomplete: React.FC<CurrencyAutocompleteProps> = ({
  currency,
  onChangeAction,
  autoComplete = "off",
  fullWidth,
  required,
  label,
  placeholder,
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

  const getOptionLabel = useCallback(
    (option: CurrencyOption) => getCurrencyOptionRowLabel(option, locale),
    [locale]
  );

  return (
    <Autocomplete<CurrencyOption, false, false, false>
      fullWidth={fullWidth}
      options={options}
      autoHighlight
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
      value={currency ?? null}
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
      filterOptions={filterOptions}
      slotProps={{
        popper: getCurrencyAutocompletePopperSlotProps({
          matchAnchorWidth,
          disablePortal: disablePortal || listAttached,
          listAttached,
        }),
        paper: getCurrencyAutocompletePaperSlotProps(listAttached),
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={{ px: 2, py: 1 }} {...optionProps}>
            <CurrencyOptionRow currency={option} locale={locale} showSymbol={showSymbol} />
          </Box>
        );
      }}
      renderInput={params => {
        const resolvedLabel = listAttached ? undefined : (label ?? t("selectCurrency"));
        const resolvedPlaceholder = listAttached
          ? (label ?? t("selectCurrency"))
          : (placeholder ?? t("searchByCodeOrName"));

        return (
          <TextField
            {...params}
            label={resolvedLabel}
            placeholder={resolvedPlaceholder}
            required={required}
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
      }}
    />
  );
};

export type { CurrencyCode, CurrencyOption };
export { getCurrencyByCode };
