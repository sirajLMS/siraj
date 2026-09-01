"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useCallback, useMemo } from "react";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { userPaymentMethodToOptionLabel } from "@/frontend/common/lib/user-payment-method";
import { type PaymentMethodLabels, Translation, useAppTranslation } from "@/shared/locale";

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

type UserPaymentMethodAutocompleteSlotProps = {
  readonly optionSx?: SxProps<Theme>;
};

function createPaymentMethodResolver(
  tType: PaymentMethodLabels["type"],
  tDirection: PaymentMethodLabels["direction"],
  tIdentifier: PaymentMethodLabels["identifier"],
  tSelect: PaymentMethodLabels["select"],
  tDisplay: PaymentMethodLabels["display"]
): (key: string) => string {
  return (key: string): string => {
    switch (key) {
      case "type.mobileWallet":
        return tType.mobileWallet;
      case "type.paymentLink":
        return tType.paymentLink;
      case "type.onlineAccount":
        return tType.onlineAccount;
      case "type.bankTransfer":
        return tType.bankTransfer;
      case "type.cash":
        return tType.cash;
      case "type.proofUpload":
        return tType.proofUpload;
      case "direction.in":
        return tDirection.in;
      case "direction.out":
        return tDirection.out;
      case "direction.both":
        return tDirection.both;
      case "identifier.email":
        return tIdentifier.email;
      case "identifier.handle":
        return tIdentifier.handle;
      case "identifier.emailOrHandle":
        return tIdentifier.emailOrHandle;
      case "select.selectMethod":
        return tSelect.selectMethod;
      case "select.searchByNameOrSlug":
        return tSelect.searchByNameOrSlug;
      case "select.required":
        return tSelect.required;
      case "display.defaultBadge":
        return tDisplay.defaultBadge;
      default:
        return key;
    }
  };
}

const filterOptions = createFilterOptions<UserPaymentMethodFieldsFragment>({
  matchFrom: "any",
  stringify: method => userPaymentMethodToOptionLabel(method, () => method.label ?? method.type ?? ""),
});

type ScaffoldProps = UserPaymentMethodAutocompleteProps & UserPaymentMethodAutocompleteSlotProps;

export function UserPaymentMethodAutocompleteShared({
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
  optionSx,
}: Readonly<ScaffoldProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);

  const resolveLabel = useMemo(
    () => createPaymentMethodResolver(t.type, t.direction, t.identifier, t.select, t.display),
    [t]
  );

  const getOptionLabel = useCallback(
    (method: UserPaymentMethodFieldsFragment) => userPaymentMethodToOptionLabel(method, resolveLabel),
    [resolveLabel]
  );

  const normalizedOptions = useMemo(
    () => options.filter((method): method is UserPaymentMethodFieldsFragment & { id: string } => Boolean(method.id)),
    [options]
  );

  const showRequiredError = Boolean(required) && !value;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.select.required : undefined);

  return (
    <Autocomplete<UserPaymentMethodFieldsFragment>
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
        const typeLabel = method.type ? getPaymentMethodTypeLabel(method.type, resolveLabel) : "";
        return (
          <Box key={key} component="li" sx={optionSx ?? { px: 2, py: 1 }} {...optionProps}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Typography variant="bodyMd" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {userPaymentMethodToOptionLabel(method, resolveLabel)}
              </Typography>
              {method.isDefault ? <Chip size="small" label={t.display.defaultBadge} /> : null}
              {typeLabel ? (
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
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
          label={label ?? t.select.selectMethod}
          placeholder={placeholder ?? t.select.searchByNameOrSlug}
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
