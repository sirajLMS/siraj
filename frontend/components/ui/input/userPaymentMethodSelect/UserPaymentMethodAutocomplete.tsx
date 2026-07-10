"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useMemo } from "react";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { getPaymentMethodTypeLabel } from "@/frontend/lib/payment-method";
import { userPaymentMethodToOptionLabel } from "@/frontend/lib/user-payment-method";

export type UserPaymentMethodAutocompleteProps = {
  readonly value?: UserPaymentMethodFieldsFragment | null;
  readonly options: readonly UserPaymentMethodFieldsFragment[];
  readonly onChangeAction: (method: UserPaymentMethodFieldsFragment) => void;
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
};

const filterOptions = createFilterOptions<UserPaymentMethodFieldsFragment>({
  matchFrom: "any",
  stringify: method => userPaymentMethodToOptionLabel(method, () => method.label ?? method.type ?? ""),
});

export function UserPaymentMethodAutocomplete({
  value,
  options,
  onChangeAction,
  autoComplete = "off",
  fullWidth,
  required,
  disabled,
  label,
  placeholder,
  error,
  helperText,
  onBlurAction,
  style,
}: UserPaymentMethodAutocompleteProps): React.ReactNode {
  const tUi = useTranslations("ui.paymentMethod");
  const tSelect = useTranslations("ui.paymentMethod.select");

  const getOptionLabel = useCallback(
    (method: UserPaymentMethodFieldsFragment) => userPaymentMethodToOptionLabel(method, key => tUi(key as never)),
    [tUi]
  );

  const normalizedOptions = useMemo(
    () => options.filter((method): method is UserPaymentMethodFieldsFragment & { id: string } => Boolean(method.id)),
    [options]
  );

  const showRequiredError = Boolean(required) && !value;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? tSelect("required") : undefined);

  return (
    <Autocomplete<UserPaymentMethodFieldsFragment, false, false, false>
      fullWidth={fullWidth}
      options={normalizedOptions}
      autoHighlight
      disabled={disabled}
      value={value ?? null}
      sx={style}
      onChange={(_, newValue) => {
        if (newValue) {
          onChangeAction(newValue);
        }
      }}
      onBlur={onBlurAction}
      isOptionEqualToValue={(left, right) => left.id === right.id}
      getOptionLabel={getOptionLabel}
      filterOptions={filterOptions}
      renderOption={(props, method) => {
        const { key, ...optionProps } = props;
        const typeLabel = method.type ? getPaymentMethodTypeLabel(method.type, key => tUi(key as never)) : "";
        return (
          <Box key={key} component="li" sx={{ px: 2, py: 1 }} {...optionProps}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Typography variant="bodyMd" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {userPaymentMethodToOptionLabel(method, key => tUi(key as never))}
              </Typography>
              {method.isDefault ? <Chip size="small" label={tUi("display.defaultBadge")} /> : null}
              {typeLabel ? (
                <Typography variant="labelMd" sx={{ color: "text.secondary", flexShrink: 0 }}>
                  {typeLabel}
                </Typography>
              ) : null}
            </Box>
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label ?? tSelect("selectMethod")}
          placeholder={placeholder ?? tSelect("searchByNameOrSlug")}
          required={required}
          error={showError}
          helperText={resolvedHelperText}
          onBlur={onBlurAction}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                  {params.slotProps.input?.startAdornment}
                </>
              ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              autoComplete,
            },
          }}
        />
      )}
    />
  );
}
