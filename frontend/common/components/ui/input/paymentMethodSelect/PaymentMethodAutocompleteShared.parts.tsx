"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { useCallback } from "react";
import {
  type buildSlotProps,
  filterOptions,
  resolveSlotProps,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared.helpers";
import type { InputFieldValues } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared.hooks";
import {
  getPaymentMethodCatalogOptionLabel,
  type PaymentMethodCatalogOption,
} from "@/frontend/common/lib/payment-method";

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

export type RenderOption = (
  props: React.HTMLAttributes<HTMLLIElement> & { readonly key?: React.Key },
  entry: PaymentMethodCatalogOption
) => React.ReactNode;

type AutocompleteContentProps = {
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
  readonly renderOption: RenderOption;
  readonly inputFields: InputFieldValues;
};

export const AutocompleteContent: React.FC<AutocompleteContentProps> = ({
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
