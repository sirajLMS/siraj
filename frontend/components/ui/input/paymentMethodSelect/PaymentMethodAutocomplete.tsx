"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { PaymentMethodOptionRow } from "@/frontend/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow";
import {
  getPaymentMethodAutocompletePaperSlotProps,
  getPaymentMethodAutocompletePopperSlotProps,
} from "@/frontend/components/ui/input/paymentMethodSelect/paymentMethodAutocompletePopper";
import type { PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import { getPaymentMethodCatalogOptionLabel, type PaymentMethodCatalogOption } from "@/frontend/lib/payment-method";

export type PaymentMethodAutocompleteProps = {
  readonly option?: PaymentMethodCatalogOption | null;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly onChangeAction: (option: PaymentMethodCatalogOption) => void;
  readonly type?: PaymentMethodType | null;
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
  readonly allowedSlugs?: readonly string[];
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
  readonly showSlug?: boolean;
};

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
    <Box key={key} component="li" sx={{ px: 2, py: 1 }} {...optionProps}>
      <PaymentMethodOptionRow option={entry} type={type} showSlug={showSlug} />
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

export const PaymentMethodAutocomplete: React.FC<PaymentMethodAutocompleteProps> = ({
  option,
  options: allOptionsProp,
  onChangeAction,
  type,
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
  allowedSlugs,
  matchAnchorWidth = true,
  disablePortal = false,
  listAttached = false,
  showSlug = true,
}: PaymentMethodAutocompleteProps): React.ReactNode => {
  const t = useTranslations("ui.paymentMethod.select");
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
  const resolvedHelperText = helperText ?? (showRequiredError ? t("required") : undefined);

  const resolvedLabel = listAttached ? undefined : (label ?? t("selectMethod"));
  const resolvedPlaceholder = listAttached ? (label ?? t("selectMethod")) : (placeholder ?? t("searchByNameOrSlug"));

  const autocompleteSx = useMemo(() => buildAutocompleteSx(style, listAttached, isOpen), [style, listAttached, isOpen]);

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
      sx={autocompleteSx}
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

export type { PaymentMethodCatalogOption };
