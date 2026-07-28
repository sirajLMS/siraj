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
import { PaymentMethodOptionRow } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow";
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
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
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
      <PaymentMethodOptionRow option={entry} type={type} showSlug={showSlug} />
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

const buildListAttachedSx = (
  style: React.CSSProperties | undefined,
  listAttached: boolean,
  isOpen: boolean
): React.CSSProperties => {
  if (!listAttached) {
    return style ?? {};
  }
  const listAttachedOverrides: Record<string, React.CSSProperties> = {
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
  };
  return style ? { ...style, ...listAttachedOverrides } : listAttachedOverrides;
};

const buildSlotProps = (
  matchAnchorWidth: boolean,
  disablePortal: boolean,
  listAttached: boolean
): {
  readonly popper: ReturnType<typeof getPaymentMethodAutocompletePopperSlotProps>;
  readonly paper: ReturnType<typeof getPaymentMethodAutocompletePaperSlotProps>;
} => ({
  popper: getPaymentMethodAutocompletePopperSlotProps({
    matchAnchorWidth,
    disablePortal: disablePortal || listAttached,
    listAttached,
  }),
  paper: getPaymentMethodAutocompletePaperSlotProps(listAttached),
});

const renderAutocompleteInput = (
  params: React.ComponentProps<typeof TextField>,
  fields: {
    readonly option?: PaymentMethodCatalogOption | null;
    readonly label?: string;
    readonly placeholder?: string;
    readonly required?: boolean;
    readonly showError: boolean;
    readonly resolvedHelperText?: string;
    readonly onBlur?: () => void;
    readonly autoFocus?: boolean;
    readonly autoComplete: string;
  }
): React.ReactNode => (
  <AutocompleteTextField
    params={params}
    label={fields.label}
    placeholder={fields.placeholder}
    required={fields.required}
    showError={fields.showError}
    resolvedHelperText={fields.resolvedHelperText}
    onBlur={fields.onBlur}
    autoFocus={fields.autoFocus}
    autoComplete={fields.autoComplete}
    option={fields.option}
  />
);

const filterByAllowedSlugs = (
  allOptions: readonly PaymentMethodCatalogOption[],
  allowedSlugs: readonly string[] | undefined
): readonly PaymentMethodCatalogOption[] => {
  if (!allowedSlugs || allowedSlugs.length === 0) {
    return allOptions;
  }
  return allOptions.filter(entry => allowedSlugs.includes(entry.slug));
};

const resolveInputLabels = (
  listAttached: boolean,
  label: string | undefined,
  placeholder: string | undefined,
  t: { readonly selectMethod: string; readonly searchByNameOrSlug: string }
): { readonly label: string | undefined; readonly placeholder: string | undefined } => ({
  label: listAttached ? undefined : (label ?? t.selectMethod),
  placeholder: listAttached ? (label ?? t.selectMethod) : (placeholder ?? t.searchByNameOrSlug),
});

const resolveErrorState = (
  required: boolean | undefined,
  option: PaymentMethodCatalogOption | null | undefined,
  error: boolean | undefined,
  helperText: string | undefined,
  requiredText: string
): { readonly showError: boolean; readonly helperText: string | undefined } => {
  const showRequiredError = Boolean(required) && !option;
  return {
    showError: Boolean(error) || showRequiredError,
    helperText: helperText ?? (showRequiredError ? requiredText : undefined),
  };
};

const useChangeHandlers = (
  openProp: boolean | undefined,
  onOpenAction: (() => void) | undefined,
  onCloseAction: (() => void) | undefined,
  onChangeAction: ((value: PaymentMethodCatalogOption) => void) | undefined,
  setInternalOpen: (open: boolean) => void
): {
  readonly handleOpen: () => void;
  readonly handleClose: () => void;
  readonly handleChange: (_: unknown, newValue: PaymentMethodCatalogOption | null) => void;
} => ({
  handleOpen: useCallback(() => {
    if (openProp === undefined) {
      setInternalOpen(true);
    }
    onOpenAction?.();
  }, [openProp, onOpenAction, setInternalOpen]),
  handleClose: useCallback(() => {
    if (openProp === undefined) {
      setInternalOpen(false);
    }
    onCloseAction?.();
  }, [openProp, onCloseAction, setInternalOpen]),
  handleChange: useCallback(
    (_: unknown, newValue: PaymentMethodCatalogOption | null) => {
      if (newValue) {
        onChangeAction?.(newValue);
      }
    },
    [onChangeAction]
  ),
});

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
  const t = useAppTranslation(Translation.Ui.PaymentMethod).select;
  // EXCEPTION: documented in frontend/common/components/ui/AGENTS.md (purely ephemeral autocomplete open state — allowed in viewport-agnostic primitives)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const options = useMemo(() => filterByAllowedSlugs(allOptionsProp, allowedSlugs), [allOptionsProp, allowedSlugs]);

  const { handleOpen, handleClose, handleChange } = useChangeHandlers(
    openProp,
    onOpenAction,
    onCloseAction,
    onChangeAction,
    setInternalOpen
  );

  const renderOption = useRenderOption(type, showSlug);

  const { showError, helperText: resolvedHelperText } = resolveErrorState(
    required,
    option,
    error,
    helperText,
    t.required
  );
  const { label: resolvedLabel, placeholder: resolvedPlaceholder } = resolveInputLabels(
    listAttached,
    label,
    placeholder,
    t
  );

  const listAttachedSx = useMemo(() => buildListAttachedSx(style, listAttached, isOpen), [style, listAttached, isOpen]);

  const slotProps = useMemo(
    () => buildSlotProps(matchAnchorWidth, disablePortal, listAttached),
    [matchAnchorWidth, disablePortal, listAttached]
  );

  const inputFields = useMemo(
    () => ({
      option,
      label: resolvedLabel,
      placeholder: resolvedPlaceholder,
      required,
      showError,
      resolvedHelperText,
      onBlur,
      autoFocus,
      autoComplete,
    }),
    [
      option,
      resolvedLabel,
      resolvedPlaceholder,
      required,
      showError,
      resolvedHelperText,
      onBlur,
      autoFocus,
      autoComplete,
    ]
  );

  const getOptionLabel = useCallback(
    (entry: PaymentMethodCatalogOption) => getPaymentMethodCatalogOptionLabel(entry),
    []
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
      renderInput={params => renderAutocompleteInput(params, inputFields)}
    />
  );
};
