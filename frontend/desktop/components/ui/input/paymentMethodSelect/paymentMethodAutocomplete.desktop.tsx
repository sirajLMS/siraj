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
import { PaymentMethodOptionRowDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.desktop";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PaymentMethodCatalogOption };

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
      <PaymentMethodOptionRowDesktop option={entry} type={type} showSlug={showSlug} />
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
    <InputAdornment position="end">
      <Typography component="span" dir="ltr" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
        {option.slug}
      </Typography>
    </InputAdornment>
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

const useFilteredOptions = (
  allOptionsProp: readonly PaymentMethodCatalogOption[],
  allowedSlugs?: readonly string[]
): readonly PaymentMethodCatalogOption[] =>
  useMemo(() => {
    if (!allowedSlugs || allowedSlugs.length === 0) {
      return allOptionsProp;
    }
    return allOptionsProp.filter(entry => allowedSlugs.includes(entry.slug));
  }, [allOptionsProp, allowedSlugs]);

const useOpenState = (
  openProp: boolean | undefined,
  onOpenAction?: () => void,
  onCloseAction?: () => void
): {
  readonly isOpen: boolean;
  readonly handleOpen: () => void;
  readonly handleClose: () => void;
} => {
  // EXCEPTION: documented in frontend/desktop/AGENTS.md (purely ephemeral autocomplete open state — tier-paired primitives mirror mobile allowance per common/components/ui/AGENTS.md)
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

  return { isOpen, handleOpen, handleClose };
};

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
                : null),
            },
          }
        : null),
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

const resolveFieldText = (
  required: boolean | undefined,
  error: boolean | undefined,
  helperText: string | undefined,
  option: PaymentMethodCatalogOption | null | undefined,
  requiredLabel: string
): {
  readonly showError: boolean;
  readonly resolvedHelperText: string | undefined;
} => {
  const showRequiredError = Boolean(required) && !option;
  const showError = Boolean(error) || showRequiredError;

  let resolvedHelperText: string | undefined;
  if (showRequiredError) {
    resolvedHelperText = requiredLabel;
  } else {
    resolvedHelperText = helperText;
  }

  return { showError, resolvedHelperText };
};

const resolveDisplayLabels = (
  listAttached: boolean,
  label: string | undefined,
  placeholder: string | undefined,
  selectMethodLabel: string,
  searchBySlugLabel: string
): {
  readonly resolvedLabel: string | undefined;
  readonly resolvedPlaceholder: string | undefined;
} => {
  let resolvedLabel: string | undefined;
  let resolvedPlaceholder: string | undefined;

  if (listAttached) {
    resolvedLabel = undefined;
    resolvedPlaceholder = label ?? selectMethodLabel;
  } else {
    resolvedLabel = label ?? selectMethodLabel;
    resolvedPlaceholder = placeholder ?? searchBySlugLabel;
  }

  return { resolvedLabel, resolvedPlaceholder };
};

const AutocompleteContent: React.FC<{
  readonly fullWidth?: boolean;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly disabled?: boolean;
  readonly isOpen: boolean;
  readonly handleOpen: () => void;
  readonly handleClose: () => void;
  readonly option: PaymentMethodCatalogOption | null | undefined;
  readonly onBlur?: () => void;
  readonly sx: React.CSSProperties;
  readonly slotProps: ReturnType<typeof useAutocompleteSlotProps>;
  readonly type?: PaymentMethodType | null;
  readonly showSlug: boolean;
  readonly paramsLabel: string | undefined;
  readonly paramsPlaceholder: string | undefined;
  readonly required?: boolean;
  readonly showError: boolean;
  readonly resolvedHelperText: string | undefined;
  readonly autoFocus?: boolean;
  readonly autoComplete: string;
  readonly onChangeAction: (entry: PaymentMethodCatalogOption) => void;
}> = ({
  fullWidth,
  options,
  disabled,
  isOpen,
  handleOpen,
  handleClose,
  option,
  onBlur,
  sx,
  slotProps,
  type,
  showSlug,
  paramsLabel,
  paramsPlaceholder,
  required,
  showError,
  resolvedHelperText,
  autoFocus,
  autoComplete,
  onChangeAction,
}) => {
  const getOptionLabel = useCallback(
    (entry: PaymentMethodCatalogOption) => getPaymentMethodCatalogOptionLabel(entry),
    []
  );

  const handleChange = useCallback(
    (_: unknown, newValue: PaymentMethodCatalogOption | null) => {
      if (newValue) {
        onChangeAction(newValue);
      }
    },
    [onChangeAction]
  );

  const renderOption = useCallback(
    (props: React.HTMLAttributes<HTMLLIElement>, entry: PaymentMethodCatalogOption) => (
      <PaymentMethodOption props={props} entry={entry} type={type} showSlug={showSlug} />
    ),
    [type, showSlug]
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
      sx={sx}
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
          label={paramsLabel}
          placeholder={paramsPlaceholder}
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

export const PaymentMethodAutocompleteDesktop: React.FC<PaymentMethodAutocompleteProps> = ({
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
  const t = useAppTranslation(Translation.Ui.PaymentMethod).select;

  const options = useFilteredOptions(allOptionsProp, allowedSlugs);

  const { isOpen, handleOpen, handleClose } = useOpenState(openProp, onOpenAction, onCloseAction);

  const { showError, resolvedHelperText } = resolveFieldText(required, error, helperText, option, t.required);

  const { resolvedLabel, resolvedPlaceholder } = resolveDisplayLabels(
    listAttached,
    label,
    placeholder,
    t.selectMethod,
    t.searchByNameOrSlug
  );

  const sx = useListAttachedSx(style, listAttached, isOpen);

  const slotProps = useAutocompleteSlotProps(matchAnchorWidth, disablePortal, listAttached);

  return (
    <AutocompleteContent
      fullWidth={fullWidth}
      options={options}
      disabled={disabled}
      isOpen={isOpen}
      handleOpen={handleOpen}
      handleClose={handleClose}
      option={option}
      onBlur={onBlur}
      sx={sx}
      slotProps={slotProps}
      type={type}
      showSlug={showSlug}
      paramsLabel={resolvedLabel}
      paramsPlaceholder={resolvedPlaceholder}
      required={required}
      showError={showError}
      resolvedHelperText={resolvedHelperText}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      onChangeAction={onChangeAction}
    />
  );
};
