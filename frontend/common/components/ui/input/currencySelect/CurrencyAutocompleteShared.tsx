"use client";

import Autocomplete from "@mui/material/Autocomplete";
import type * as React from "react";
import { useCallback, useMemo } from "react";
import {
  buildAutocompleteSx,
  currencyFilterOptions,
  resolveCurrencyOptions,
} from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared.helpers";
import { useCurrencyAutocomplete } from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared.hooks";
import {
  renderCurrencyInput,
  renderCurrencyOption,
} from "@/frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared.parts";
import { getCurrencyOptionRowLabel } from "@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.utils";
import type { CurrencyAutocompleteSharedProps } from "@/frontend/common/components/ui/input/currencySelect/types/currencyAutocompleteShared.types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export const CurrencyAutocompleteShared: React.FC<CurrencyAutocompleteSharedProps> = (
  props: Readonly<CurrencyAutocompleteSharedProps>
): React.ReactNode => {
  const t = useAppTranslation(Translation.Ui.CurrencySelect);
  const locale = useAppLocale();
  const { isOpen, handleOpen, handleClose, handleChange } = useCurrencyAutocomplete({
    openProp: props.open,
    onOpenAction: props.onOpenAction,
    onCloseAction: props.onCloseAction,
    onChangeAction: props.onChangeAction,
    onClearAction: props.onClearAction,
  });

  const { options: allOptions, allowedCodes, excludedCodes, catalogLoaded = true, currency } = props;
  const options = useMemo(
    () => resolveCurrencyOptions(allOptions, allowedCodes, excludedCodes, catalogLoaded, currency),
    [allOptions, allowedCodes, excludedCodes, catalogLoaded, currency]
  );

  const getOptionLabel = useCallback((option: CurrencyOption) => getCurrencyOptionRowLabel(option, locale), [locale]);

  const { required, error, helperText, label, placeholder, listAttached = false, fullWidth, fullWidthDefault } = props;
  const showRequiredError = Boolean(required) && !currency;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);
  const resolvedLabel = listAttached ? undefined : (label ?? t.selectCurrency);
  const resolvedPlaceholder = listAttached ? (label ?? t.selectCurrency) : (placeholder ?? t.searchByCodeOrName);

  return (
    <Autocomplete<CurrencyOption>
      fullWidth={fullWidth ?? fullWidthDefault}
      options={options}
      autoHighlight
      disabled={props.disabled}
      open={isOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      value={currency ?? null}
      sx={buildAutocompleteSx(props.style, listAttached, isOpen)}
      onChange={handleChange}
      onBlur={props.onBlurAction}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={getOptionLabel}
      filterOptions={currencyFilterOptions}
      slotProps={{
        popper: props.getPopperSlotProps({
          matchAnchorWidth: props.matchAnchorWidth ?? true,
          disablePortal: (props.disablePortal ?? false) || listAttached,
          listAttached,
        }),
        paper: props.getPaperSlotProps(listAttached),
      }}
      renderOption={(optionProps, option) =>
        renderCurrencyOption({
          props: optionProps,
          option,
          locale,
          showSymbol: props.showSymbol ?? true,
          OptionRowComponent: props.CurrencyOptionRowComponent,
          optionRowSx: props.optionRowSx,
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
          onBlur: props.onBlurAction,
          autoFocus: props.autoFocus,
          autoComplete: props.autoComplete ?? "off",
          currency,
          showSymbol: props.showSymbol ?? true,
          LocaleEmojiComponent: props.LocaleEmojiComponent,
        })
      }
    />
  );
};
