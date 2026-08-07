"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  getPaymentMethodAutocompletePaperSlotProps,
  getPaymentMethodAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/paymentMethodAutocompletePopper";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import type { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getPaymentMethodCatalogOptionLabel,
  type PaymentMethodCatalogOption,
} from "@/frontend/common/lib/payment-method";
import { PaymentMethodOptionRowMobile } from "@/frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.mobile";
import { Translation, useAppTranslation } from "@/shared/locale";

const filterOptions = createFilterOptions<PaymentMethodCatalogOption>({
  matchFrom: "any",
  stringify: option => `${option.displayName} ${option.slug}`,
});

const PaymentMethodOption: React.FC<{
  readonly props: React.HTMLAttributes<HTMLLIElement> & { readonly key?: React.Key };
  readonly entry: PaymentMethodCatalogOption;
  readonly type?: PaymentMethodType | null;
  readonly showSlug: boolean;
}> = ({ props, entry, type, showSlug }) => {
  const { key, ...optionProps } = props;
  return (
    <Box key={key} component="li" sx={{ px: 1.5, py: 1.25, minHeight: 48 }} {...optionProps}>
      <PaymentMethodOptionRowMobile option={entry} type={type} showSlug={showSlug} />
    </Box>
  );
};

const StartAdornment: React.FC<{
  readonly option?: PaymentMethodCatalogOption | null;
  readonly existingAdornment: React.ReactNode;
}> = ({ option, existingAdornment }) => (
  <>
    <InputAdornment position="start">
      <SearchOutlinedIcon fontSize="small" />
    </InputAdornment>
    {option?.logoUrl ? (
      <InputAdornment position="start">
        <Avatar src={option.logoUrl} alt="" sx={{ width: 20, height: 20 }} />
      </InputAdornment>
    ) : null}
    {existingAdornment}
  </>
);

const EndAdornment: React.FC<{
  readonly option?: PaymentMethodCatalogOption | null;
  readonly existingAdornment: React.ReactNode;
}> = ({ option, existingAdornment }) =>
  option ? (
    <>
      {existingAdornment}
      <InputAdornment position="end">
        <Typography component="span" dir="ltr" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
          {option.slug}
        </Typography>
      </InputAdornment>
    </>
  ) : (
    existingAdornment
  );

const AutocompleteTextField: React.FC<{
  readonly params: React.ComponentProps<typeof TextField>;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly showError: boolean;
  readonly resolvedHelperText?: string;
  readonly onBlur?: () => void;
  readonly autoFocus?: boolean;
  readonly autoComplete: string;
  readonly option?: PaymentMethodCatalogOption | null;
}> = ({
  params,
  label,
  placeholder,
  required,
  showError,
  resolvedHelperText,
  onBlur,
  autoFocus,
  autoComplete,
  option,
}) => {
  const {
    input: inputSlotProps,
    htmlInput: htmlInputSlotProps,
    ...restSlotProps
  } = params.slotProps as {
    input?: { startAdornment?: React.ReactNode; endAdornment?: React.ReactNode } & Record<string, unknown>;
    htmlInput?: Record<string, unknown>;
  } & Record<string, unknown>;
  return (
    <TextField
      {...params}
      size="small"
      label={label}
      placeholder={placeholder}
      required={required}
      error={showError}
      helperText={resolvedHelperText}
      onBlur={onBlur}
      
      slotProps={{
        ...restSlotProps,
        input: {
          ...inputSlotProps,
          startAdornment: <StartAdornment option={option} existingAdornment={inputSlotProps?.startAdornment} />,
          endAdornment: <EndAdornment option={option} existingAdornment={inputSlotProps?.endAdornment} />,
        },
        htmlInput: {
          ...htmlInputSlotProps,
          autoComplete,
        },
      }}
    />
  );
};

const isOptionEqualToValue = (left: PaymentMethodCatalogOption, right: PaymentMethodCatalogOption): boolean =>
  left.id === right.id;

const useFilteredOptions = (
  allOptionsProp: readonly PaymentMethodCatalogOption[],
  allowedSlugs: readonly string[] | undefined
): PaymentMethodCatalogOption[] =>
  useMemo(() => {
    if (!allowedSlugs || allowedSlugs.length === 0) {
      return [...allOptionsProp];
    }
    return allOptionsProp.filter(entry => allowedSlugs.includes(entry.slug));
  }, [allOptionsProp, allowedSlugs]);

const useAutocompleteOpenState = (
  openProp: boolean | undefined,
  onOpenAction: (() => void) | undefined,
  onCloseAction: (() => void) | undefined
): readonly [boolean, () => void, () => void] => {
  // EXCEPTION: documented in frontend/mobile/AGENTS.md (purely ephemeral autocomplete open state)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;
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
  return [isOpen, handleOpen, handleClose] as const;
};

const useChangeHandler = (
  onChangeAction: (value: PaymentMethodCatalogOption) => void
): ((_: unknown, newValue: PaymentMethodCatalogOption | null) => void) =>
  useCallback(
    (_: unknown, newValue: PaymentMethodCatalogOption | null) => {
      if (newValue) {
        onChangeAction(newValue);
      }
    },
    [onChangeAction]
  );

const useRenderOption = (
  type: PaymentMethodType | null | undefined,
  showSlug: boolean
): ((
  props: React.HTMLAttributes<HTMLLIElement> & { readonly key?: React.Key },
  entry: PaymentMethodCatalogOption
) => React.ReactNode) =>
  useCallback(
    (props: React.HTMLAttributes<HTMLLIElement> & { readonly key?: React.Key }, entry: PaymentMethodCatalogOption) => (
      <PaymentMethodOption props={props} entry={entry} type={type} showSlug={showSlug} />
    ),
    [type, showSlug]
  );

const useListAttachedSx = (
  style: React.CSSProperties | undefined,
  listAttached: boolean,
  isOpen: boolean
): React.CSSProperties =>
  useMemo<React.CSSProperties>(
    () => ({
      ...style,
      ...(listAttached
        ? {
            "& .MuiOutlinedInput-root": {
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              ...(isOpen
                ? {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }
                : {}),
            },
          }
        : {}),
    }),
    [style, listAttached, isOpen]
  );

const useAutocompleteSlotProps = (matchAnchorWidth: boolean, disablePortal: boolean, listAttached: boolean) =>
  useMemo(
    () => ({
      popper: getPaymentMethodAutocompletePopperSlotProps({
        matchAnchorWidth,
        disablePortal: disablePortal || listAttached,
        listAttached,
      }),
      paper: getPaymentMethodAutocompletePaperSlotProps(listAttached),
    }),
    [matchAnchorWidth, disablePortal, listAttached]
  );

interface PaymentMethodSelectTranslations {
  readonly required: string;
  readonly selectMethod: string;
  readonly searchByNameOrSlug: string;
}

interface ResolveDisplayValuesParams {
  readonly t: PaymentMethodSelectTranslations;
  readonly option: PaymentMethodCatalogOption | null | undefined;
  readonly required: boolean | undefined;
  readonly error: boolean | undefined;
  readonly helperText: string | undefined;
  readonly label: string | undefined;
  readonly placeholder: string | undefined;
  readonly listAttached: boolean;
}

const resolveDisplayValues = (
  params: ResolveDisplayValuesParams
): {
  showError: boolean;
  resolvedHelperText: string | undefined;
  resolvedLabel: string | undefined;
  resolvedPlaceholder: string | undefined;
} => {
  const { t, option, required, error, helperText, label, placeholder, listAttached } = params;
  const showRequiredError = Boolean(required) && !option;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);
  const resolvedLabel = listAttached ? undefined : (label ?? t.selectMethod);
  const resolvedPlaceholder = listAttached ? (label ?? t.selectMethod) : (placeholder ?? t.searchByNameOrSlug);
  return { showError, resolvedHelperText, resolvedLabel, resolvedPlaceholder };
};

interface RenderAutocompleteInputParams {
  readonly params: React.ComponentProps<typeof TextField>;
  readonly resolvedLabel: string | undefined;
  readonly resolvedPlaceholder: string | undefined;
  readonly required: boolean | undefined;
  readonly showError: boolean;
  readonly resolvedHelperText: string | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly autoFocus: boolean | undefined;
  readonly autoComplete: string;
  readonly option: PaymentMethodCatalogOption | null | undefined;
}

const renderAutocompleteInput = ({
  params,
  resolvedLabel,
  resolvedPlaceholder,
  required,
  showError,
  resolvedHelperText,
  onBlur,
  autoFocus,
  autoComplete,
  option,
}: RenderAutocompleteInputParams): React.ReactNode => (
  <AutocompleteTextField
    params={params}
    label={resolvedLabel}
    placeholder={resolvedPlaceholder}
    required={required}
    showError={showError}
    resolvedHelperText={resolvedHelperText}
    onBlur={onBlur}
    
    autoComplete={autoComplete}
    option={option}
  />
);

export const PaymentMethodAutocompleteMobile: React.FC<PaymentMethodAutocompleteProps> = ({
  option,
  options: allOptionsProp,
  onChangeAction,
  type,
  autoComplete = "off",
  fullWidth = true,
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
  allowedSlugs,
  matchAnchorWidth = true,
  disablePortal = false,
  listAttached = false,
  showSlug = true,
}: PaymentMethodAutocompleteProps): React.ReactNode => {
  const t = useAppTranslation(Translation.Ui.PaymentMethod).select;
  const options = useFilteredOptions(allOptionsProp, allowedSlugs);
  const [isOpen, handleOpen, handleClose] = useAutocompleteOpenState(openProp, onOpenAction, onCloseAction);
  const handleChange = useChangeHandler(onChangeAction);
  const renderOption = useRenderOption(type, showSlug);
  const listAttachedSx = useListAttachedSx(style, listAttached, isOpen);
  const autocompleteSlotProps = useAutocompleteSlotProps(matchAnchorWidth, disablePortal, listAttached);
  const { showError, resolvedHelperText, resolvedLabel, resolvedPlaceholder } = resolveDisplayValues({
    t,
    option,
    required,
    error,
    helperText,
    label,
    placeholder,
    listAttached,
  });

  return (
    <Autocomplete<PaymentMethodCatalogOption, false, false, false>
      fullWidth={fullWidth}
      options={options}
      autoHighlight
      disabled={disabled}
      open={isOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      value={option ?? null}
      sx={listAttachedSx}
      onChange={handleChange}
      onBlur={onBlur}
      isOptionEqualToValue={isOptionEqualToValue}
      getOptionLabel={getPaymentMethodCatalogOptionLabel}
      filterOptions={filterOptions}
      slotProps={autocompleteSlotProps}
      renderOption={renderOption}
      renderInput={params =>
        renderAutocompleteInput({
          params,
          resolvedLabel,
          resolvedPlaceholder,
          required,
          showError,
          resolvedHelperText,
          onBlur,
          autoFocus,
          autoComplete,
          option,
        })
      }
    />
  );
};
