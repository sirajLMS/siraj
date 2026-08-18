"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import type { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getPaymentMethodCatalogOptionLabel,
  type PaymentMethodCatalogOption,
} from "@/frontend/common/lib/payment-method";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface PaymentMethodAutocompleteSlots {
  readonly OptionRow: React.FC<{
    readonly option: PaymentMethodCatalogOption;
    readonly type?: PaymentMethodType | null;
    readonly showSlug: boolean;
  }>;
  /** sx applied to each option row <Box component="li"> wrapper (mobile uses larger touch targets) */
  readonly optionRowSx?: SxProps<Theme>;
  /** TextField `size` prop — mobile passes "small" for denser layout */
  readonly textFieldSize?: "small" | "medium";
  /** Default value for the `fullWidth` prop (mobile defaults to true) */
  readonly fullWidthDefault?: boolean;
}

const filterOptions = createFilterOptions<PaymentMethodCatalogOption>({
  matchFrom: "any",
  stringify: option => `${option.displayName} ${option.slug}`,
});

interface SlotPropsInputShape {
  readonly startAdornment?: React.ReactNode;
  readonly endAdornment?: React.ReactNode;
  readonly [key: string]: unknown;
}

interface SlotPropsShape {
  readonly input?: SlotPropsInputShape;
  readonly htmlInput?: Record<string, unknown>;
}

function isSlotPropsShape(value: unknown): value is SlotPropsShape {
  return typeof value === "object" && value !== null;
}

function resolveSlotProps(slotProps: unknown): SlotPropsShape {
  if (!isSlotPropsShape(slotProps)) {
    return {};
  }
  return slotProps;
}

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
        <Box component="span" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, direction: "ltr" })}>
          {option.slug}
        </Box>
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
  readonly textFieldSize?: "small" | "medium";
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
  textFieldSize,
}) => {
  const slotProps = resolveSlotProps(params.slotProps);
  return (
    <TextField
      {...params}
      size={textFieldSize}
      autoFocus={autoFocus}
      label={label}
      placeholder={placeholder}
      required={required}
      error={showError}
      helperText={resolvedHelperText}
      onBlur={onBlur}
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

function buildListAttachedSx(
  style: React.CSSProperties | undefined,
  listAttached: boolean,
  isOpen: boolean
): React.CSSProperties {
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
}

function buildSlotProps(
  matchAnchorWidth: boolean,
  disablePortal: boolean,
  listAttached: boolean
): {
  readonly popper: ReturnType<typeof createAutocompletePopperSlotProps<PaymentMethodCatalogOption>>;
  readonly paper: ReturnType<typeof createAutocompletePaperSlotProps<PaymentMethodCatalogOption>>;
} {
  return {
    popper: createAutocompletePopperSlotProps<PaymentMethodCatalogOption>({
      matchAnchorWidth,
      disablePortal: disablePortal || listAttached,
      listAttached,
    }),
    paper: createAutocompletePaperSlotProps<PaymentMethodCatalogOption>(listAttached),
  };
}

function filterByAllowedSlugs(
  allOptions: readonly PaymentMethodCatalogOption[],
  allowedSlugs: readonly string[] | undefined
): readonly PaymentMethodCatalogOption[] {
  if (!allowedSlugs || allowedSlugs.length === 0) {
    return allOptions;
  }
  return allOptions.filter(entry => allowedSlugs.includes(entry.slug));
}

function resolveInputLabels(
  listAttached: boolean,
  label: string | undefined,
  placeholder: string | undefined,
  t: { readonly selectMethod: string; readonly searchByNameOrSlug: string }
): { readonly label: string | undefined; readonly placeholder: string | undefined } {
  return {
    label: listAttached ? undefined : (label ?? t.selectMethod),
    placeholder: listAttached ? (label ?? t.selectMethod) : (placeholder ?? t.searchByNameOrSlug),
  };
}

function resolveErrorState(
  required: boolean | undefined,
  option: PaymentMethodCatalogOption | null | undefined,
  error: boolean | undefined,
  helperText: string | undefined,
  requiredText: string
): { readonly showError: boolean; readonly helperText: string | undefined } {
  const showRequiredError = Boolean(required) && !option;
  return {
    showError: Boolean(error) || showRequiredError,
    helperText: helperText ?? (showRequiredError ? requiredText : undefined),
  };
}

function useChangeHandlers(
  openProp: boolean | undefined,
  onOpenAction: (() => void) | undefined,
  onCloseAction: (() => void) | undefined,
  onChangeAction: ((value: PaymentMethodCatalogOption) => void) | undefined,
  setInternalOpen: (open: boolean) => void
): {
  readonly handleOpen: () => void;
  readonly handleClose: () => void;
  readonly handleChange: (_: unknown, newValue: PaymentMethodCatalogOption | null) => void;
} {
  return {
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
  };
}

interface InputFieldValues {
  readonly option: PaymentMethodCatalogOption | null | undefined;
  readonly label: string | undefined;
  readonly placeholder: string | undefined;
  readonly required: boolean | undefined;
  readonly showError: boolean;
  readonly resolvedHelperText: string | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly autoFocus: boolean | undefined;
  readonly autoComplete: string;
  readonly textFieldSize: "small" | "medium" | undefined;
}

interface AutocompleteContentProps {
  readonly fullWidth?: boolean;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly disabled?: boolean;
  readonly isOpen: boolean;
  readonly handleOpen: () => void;
  readonly handleClose: () => void;
  readonly handleChange: (_: unknown, newValue: PaymentMethodCatalogOption | null) => void;
  readonly option: PaymentMethodCatalogOption | null | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly listAttachedSx: React.CSSProperties;
  readonly autocompleteSlotProps: ReturnType<typeof buildSlotProps>;
  readonly renderOption: ReturnType<typeof useRenderOption>;
  readonly inputFields: InputFieldValues;
}

const AutocompleteContent: React.FC<AutocompleteContentProps> = ({
  fullWidth,
  options,
  disabled,
  isOpen,
  handleOpen,
  handleClose,
  handleChange,
  option,
  onBlur,
  listAttachedSx,
  autocompleteSlotProps,
  renderOption,
  inputFields,
}) => {
  const getOptionLabel = useCallback(
    (entry: PaymentMethodCatalogOption) => getPaymentMethodCatalogOptionLabel(entry),
    []
  );

  return (
    <Autocomplete<PaymentMethodCatalogOption>
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
      slotProps={autocompleteSlotProps}
      renderOption={renderOption}
      renderInput={params => (
        <AutocompleteTextField
          params={params}
          label={inputFields.label}
          placeholder={inputFields.placeholder}
          required={inputFields.required}
          showError={inputFields.showError}
          resolvedHelperText={inputFields.resolvedHelperText}
          onBlur={inputFields.onBlur}
          autoFocus={inputFields.autoFocus}
          autoComplete={inputFields.autoComplete}
          option={inputFields.option}
          textFieldSize={inputFields.textFieldSize}
        />
      )}
    />
  );
};

function useRenderOption(
  slots: PaymentMethodAutocompleteSlots,
  type: PaymentMethodType | null | undefined,
  showSlug: boolean
): (
  props: React.HTMLAttributes<HTMLLIElement> & { readonly key?: React.Key },
  entry: PaymentMethodCatalogOption
) => React.ReactNode {
  return useCallback(
    (props: React.HTMLAttributes<HTMLLIElement> & { readonly key?: React.Key }, entry: PaymentMethodCatalogOption) => {
      const { key, ...optionProps } = props;
      return (
        <Box key={key} component="li" sx={slots.optionRowSx ?? { px: 2, py: 1 }} {...optionProps}>
          <slots.OptionRow option={entry} type={type} showSlug={showSlug} />
        </Box>
      );
    },
    [slots, type, showSlug]
  );
}

function useInputFields(
  option: PaymentMethodCatalogOption | null | undefined,
  resolvedLabel: string | undefined,
  resolvedPlaceholder: string | undefined,
  required: boolean | undefined,
  showError: boolean,
  resolvedHelperText: string | undefined,
  onBlur: (() => void) | undefined,
  autoFocus: boolean | undefined,
  autoComplete: string,
  textFieldSize: "small" | "medium" | undefined
): InputFieldValues {
  return useMemo(
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
      textFieldSize,
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
      textFieldSize,
    ]
  );
}

export function PaymentMethodAutocompleteShared({
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
  slots,
}: Readonly<PaymentMethodAutocompleteProps> & {
  readonly slots: PaymentMethodAutocompleteSlots;
}): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod).select;
  // EXCEPTION: documented in frontend/common/components/ui/AGENTS.md (purely ephemeral autocomplete open state — allowed in viewport-agnostic primitives)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const resolvedFullWidth = fullWidth ?? slots.fullWidthDefault ?? false;
  const options = useMemo(() => filterByAllowedSlugs(allOptionsProp, allowedSlugs), [allOptionsProp, allowedSlugs]);
  const { handleOpen, handleClose, handleChange } = useChangeHandlers(
    openProp,
    onOpenAction,
    onCloseAction,
    onChangeAction,
    setInternalOpen
  );
  const renderOption = useRenderOption(slots, type, showSlug);
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
  const autocompleteSlotProps = useMemo(
    () => buildSlotProps(matchAnchorWidth, disablePortal, listAttached),
    [matchAnchorWidth, disablePortal, listAttached]
  );
  const inputFields = useInputFields(
    option,
    resolvedLabel,
    resolvedPlaceholder,
    required,
    showError,
    resolvedHelperText,
    onBlur,
    autoFocus,
    autoComplete,
    slots.textFieldSize
  );

  return (
    <AutocompleteContent
      fullWidth={resolvedFullWidth}
      options={options}
      disabled={disabled}
      isOpen={isOpen}
      handleOpen={handleOpen}
      handleClose={handleClose}
      handleChange={handleChange}
      option={option}
      onBlur={onBlur}
      listAttachedSx={listAttachedSx}
      autocompleteSlotProps={autocompleteSlotProps}
      renderOption={renderOption}
      inputFields={inputFields}
    />
  );
}
