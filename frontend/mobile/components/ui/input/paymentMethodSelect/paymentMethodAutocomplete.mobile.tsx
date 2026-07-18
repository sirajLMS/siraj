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
import { useAppTranslation } from "@/shared/locale";

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
  const slotProps = params.slotProps as {
    input?: { startAdornment?: React.ReactNode; endAdornment?: React.ReactNode } & Record<string, unknown>;
    htmlInput?: Record<string, unknown>;
  };
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
      autoFocus={autoFocus}
      slotProps={{
        ...params.slotProps,
        input: {
          ...slotProps.input,
          startAdornment: <StartAdornment option={option} existingAdornment={slotProps.input?.startAdornment} />,
          endAdornment: <EndAdornment option={option} existingAdornment={slotProps.input?.endAdornment} />,
        },
        htmlInput: {
          ...slotProps.htmlInput,
          autoComplete,
        },
      }}
    />
  );
};

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
  const t = useAppTranslation().uiTranslations.paymentMethod.select;
  // EXCEPTION: documented in frontend/mobile/AGENTS.md (purely ephemeral autocomplete open state)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const options = useMemo(() => {
    if (!allowedSlugs || allowedSlugs.length === 0) {
      return allOptionsProp;
    }
    return allOptionsProp.filter(entry => allowedSlugs.includes(entry.slug));
  }, [allOptionsProp, allowedSlugs]);

  const getOptionLabel = useCallback(
    (entry: PaymentMethodCatalogOption) => getPaymentMethodCatalogOptionLabel(entry),
    []
  );

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
    (_: unknown, newValue: PaymentMethodCatalogOption | null) => {
      if (newValue) {
        onChangeAction(newValue);
      }
    },
    [onChangeAction]
  );

  const renderOption = useCallback(
    (props: React.HTMLAttributes<HTMLLIElement> & { readonly key?: React.Key }, entry: PaymentMethodCatalogOption) => (
      <PaymentMethodOption props={props} entry={entry} type={type} showSlug={showSlug} />
    ),
    [type, showSlug]
  );

  const showRequiredError = Boolean(required) && !option;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);

  const resolvedLabel = listAttached ? undefined : (label ?? t.selectMethod);
  const resolvedPlaceholder = listAttached ? (label ?? t.selectMethod) : (placeholder ?? t.searchByNameOrSlug);

  const listAttachedSx = useMemo<React.CSSProperties>(
    () => ({
      ...(style ?? {}),
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

  const slotProps = useMemo(
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
      isOptionEqualToValue={(left, right) => left.id === right.id}
      getOptionLabel={getOptionLabel}
      filterOptions={filterOptions}
      slotProps={slotProps}
      renderOption={renderOption}
      renderInput={params => (
        <AutocompleteTextField
          params={params}
          label={resolvedLabel}
          placeholder={resolvedPlaceholder}
          required={required}
          showError={showError}
          resolvedHelperText={resolvedHelperText}
          onBlur={onBlur}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          option={option}
        />
      )}
    />
  );
};
