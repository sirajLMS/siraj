"use client";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { type Control, Controller, type FieldValues } from "react-hook-form";
import type { PaymentMethodTypeFieldsProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { resolveFieldName } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/utils";
import { type CurrencyCode, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import type { CountryType } from "@/frontend/common/lib/locale";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import type { PaymentMethodTypeFieldsLabels } from "@/shared/locale/types/ui";

type LocalizedStringFormFieldSlot = React.ComponentType<{
  name: string;
  control: Control;
  label: string;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
}>;

type CountryAutocompleteSlot = React.ComponentType<{
  country: CountryType | undefined;
  onChangeAction: (value: CountryType | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}>;

type CurrencySelectSlot = React.ComponentType<{
  currency: CurrencyOption | null;
  setCurrencyAction: (value: CurrencyOption | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  allowedCodes?: readonly CurrencyCode[];
  fullWidth?: boolean;
}>;

type PaymentMethodSelectSlot = React.ComponentType<{
  option: PaymentMethodCatalogOption | null;
  options: readonly PaymentMethodCatalogOption[];
  setOptionAction: (option: PaymentMethodCatalogOption) => void;
  type: PaymentMethodType;
  label: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}>;

type PhoneFormFieldSlot = React.ComponentType<{
  name: string;
  control: Control;
  label: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}>;

type TagInputSlot = React.ComponentType<{
  label: string;
  initialTags: string[];
  onChange: (tags: string[]) => void;
}>;

export interface PaymentMethodTypeFieldsSlots {
  LocalizedStringFormField: LocalizedStringFormFieldSlot;
  CountryAutocomplete: CountryAutocompleteSlot;
  CurrencySelect: CurrencySelectSlot;
  PaymentMethodSelect: PaymentMethodSelectSlot;
  PhoneFormField: PhoneFormFieldSlot;
  TagInput: TagInputSlot;
}

export interface PaymentMethodTypeFieldSharedOptions {
  stackSpacing?: number;
  textFieldSize?: "small" | "medium";
}

const EMPTY_READONLY_ARRAY = [] as const;
const DEFAULT_OPTIONS: PaymentMethodTypeFieldSharedOptions = {};

export function PaymentMethodTypeFieldsShared<T extends FieldValues>({
  type,
  control,
  disabled = false,
  walletOptions = EMPTY_READONLY_ARRAY,
  paymentLinkOptions = EMPTY_READONLY_ARRAY,
  onlineAccountOptions = EMPTY_READONLY_ARRAY,
  selectedWallet,
  selectedPaymentLink,
  selectedOnlineAccount,
  onWalletChangeAction,
  onPaymentLinkChangeAction,
  onOnlineAccountChangeAction,
  allowedCurrencyCodes,
  showCatalogMetadata = false,
  detailsPrefix,
  catalogPrefix,
  slots,
  options = DEFAULT_OPTIONS,
  tTypeFields,
}: Readonly<PaymentMethodTypeFieldsProps<T>> & {
  readonly slots: PaymentMethodTypeFieldsSlots;
  readonly options?: PaymentMethodTypeFieldSharedOptions;
  readonly tTypeFields: PaymentMethodTypeFieldsLabels;
}): React.ReactNode {
  const { stackSpacing, textFieldSize } = options;
  const stackSx = stackSpacing !== undefined ? { gap: stackSpacing } : undefined;
  const stackSpacingProp = stackSpacing === undefined ? 2 : undefined;
  const sizeProp = textFieldSize ? { size: textFieldSize } : {};
  // Control<T> where T extends FieldValues is assignable to Control<FieldValues>
  // The cast is safe — TypeScript's invariance on Control prevents implicit assignment.
  const slotControl = control as Control;

  const renderCatalogMetadata = () => {
    if (!showCatalogMetadata) {
      return null;
    }

    const { LocalizedStringFormField, CountryAutocomplete, CurrencySelect, TagInput } = slots;

    return (
      <>
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "name")}
          control={slotControl}
          label={tTypeFields.name}
          disabled={disabled}
          required
        />
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "description")}
          control={slotControl}
          label={tTypeFields.description}
          disabled={disabled}
        />
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "instructions")}
          control={slotControl}
          label={tTypeFields.instructions}
          disabled={disabled}
          multiline
        />
        <Controller
          name={resolveFieldName<T>(catalogPrefix, "countryCode")}
          control={control}
          render={({ field, fieldState }) => (
            <CountryAutocomplete
              country={field.value ?? undefined}
              onChangeAction={value => field.onChange(value)}
              disabled={disabled}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />
        <Controller
          name={resolveFieldName<T>(catalogPrefix, "currency")}
          control={control}
          render={({ field, fieldState }) => (
            <CurrencySelect
              currency={field.value ?? null}
              setCurrencyAction={value => field.onChange(value)}
              disabled={disabled}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              allowedCodes={allowedCurrencyCodes}
              fullWidth
            />
          )}
        />
        {type === PaymentMethodType.PaymentLink ? (
          <Controller
            name={resolveFieldName<T>(catalogPrefix, "urlAllowlist")}
            control={control}
            render={({ field }) => (
              <TagInput
                label={tTypeFields.urlAllowlist}
                initialTags={[...(field.value ?? [])]}
                onChange={tags => field.onChange(tags)}
              />
            )}
          />
        ) : null}
      </>
    );
  };

  const { PaymentMethodSelect, PhoneFormField } = slots;

  switch (type) {
    case PaymentMethodType.MobileWallet:
      return (
        <Stack spacing={stackSpacingProp} sx={stackSx}>
          {renderCatalogMetadata()}
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "walletId")}
            control={control}
            render={({ fieldState }) => (
              <PaymentMethodSelect
                option={selectedWallet ?? null}
                options={walletOptions}
                setOptionAction={option => onWalletChangeAction?.(option)}
                type={PaymentMethodType.MobileWallet}
                label={tTypeFields.wallet}
                disabled={disabled}
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <PhoneFormField
            name={resolveFieldName<T>(detailsPrefix, "phone")}
            control={slotControl}
            label={tTypeFields.phone}
            disabled={disabled}
            required
            fullWidth
          />
        </Stack>
      );
    case PaymentMethodType.PaymentLink:
      return (
        <Stack spacing={stackSpacingProp} sx={stackSx}>
          {renderCatalogMetadata()}
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "paymentLinkId")}
            control={control}
            render={({ fieldState }) => (
              <PaymentMethodSelect
                option={selectedPaymentLink ?? null}
                options={paymentLinkOptions}
                setOptionAction={option => onPaymentLinkChangeAction?.(option)}
                type={PaymentMethodType.PaymentLink}
                label={tTypeFields.paymentLink}
                disabled={disabled}
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "url")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.url}
                value={field.value ?? ""}
                disabled={disabled}
                required
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
                slotProps={{ htmlInput: { dir: "ltr" } }}
              />
            )}
          />
        </Stack>
      );
    case PaymentMethodType.OnlineAccount:
      return (
        <Stack spacing={stackSpacingProp} sx={stackSx}>
          {renderCatalogMetadata()}
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "onlineAccountId")}
            control={control}
            render={({ fieldState }) => (
              <PaymentMethodSelect
                option={selectedOnlineAccount ?? null}
                options={onlineAccountOptions}
                setOptionAction={option => onOnlineAccountChangeAction?.(option)}
                type={PaymentMethodType.OnlineAccount}
                label={tTypeFields.onlineAccount}
                disabled={disabled}
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "identifier")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.identifier}
                value={field.value ?? ""}
                disabled={disabled}
                required
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
              />
            )}
          />
        </Stack>
      );
    case PaymentMethodType.BankTransfer:
      return (
        <Stack spacing={stackSpacingProp} sx={stackSx}>
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "beneficiaryName")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.beneficiaryName}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
              />
            )}
          />
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "bankName")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.bankName}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
              />
            )}
          />
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "iban")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.iban}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
                slotProps={{ htmlInput: { dir: "ltr" } }}
              />
            )}
          />
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "swiftBic")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.swiftBic}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
                slotProps={{ htmlInput: { dir: "ltr" } }}
              />
            )}
          />
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "accountNumber")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.accountNumber}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
                slotProps={{ htmlInput: { dir: "ltr" } }}
              />
            )}
          />
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "routingNumber")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.routingNumber}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
                slotProps={{ htmlInput: { dir: "ltr" } }}
              />
            )}
          />
        </Stack>
      );
    case PaymentMethodType.Cash:
      return (
        <Stack spacing={stackSpacingProp} sx={stackSx}>
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "note")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={tTypeFields.note}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                multiline
                minRows={2}
                {...sizeProp}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={event => field.onChange(event.target.value)}
              />
            )}
          />
        </Stack>
      );
    default:
      return null;
  }
}
