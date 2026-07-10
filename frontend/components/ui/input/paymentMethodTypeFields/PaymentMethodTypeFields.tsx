"use client";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { CountryAutocomplete } from "@/frontend/components/ui/input/countrySelect/CountryAutocomplete";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { LocalizedStringFormField } from "@/frontend/components/ui/input/localizedString/LocalizedStringFormField";
import { PaymentMethodSelect } from "@/frontend/components/ui/input/paymentMethodSelect/PaymentMethodSelect";
import { PhoneFormField } from "@/frontend/components/ui/input/phoneInput/PhoneFormField";
import { TagInput } from "@/frontend/components/ui/input/tagInput/TagInput";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { CurrencyOption } from "@/frontend/lib/currency";
import type { CountryType } from "@/frontend/lib/locale";
import type { PaymentMethodCatalogOption } from "@/frontend/lib/payment-method";

export type PaymentMethodDetailsFormValue = {
  readonly walletId?: string;
  readonly phone?: string;
  readonly paymentLinkId?: string;
  readonly url?: string;
  readonly onlineAccountId?: string;
  readonly identifier?: string;
  readonly iban?: string;
  readonly bankName?: string;
  readonly beneficiaryName?: string;
  readonly swiftBic?: string;
  readonly accountNumber?: string;
  readonly routingNumber?: string;
  readonly note?: string;
};

export type PaymentMethodCatalogFormValue = {
  readonly name?: Record<string, string>;
  readonly description?: Record<string, string>;
  readonly instructions?: Record<string, string>;
  readonly countryCode?: CountryType | null;
  readonly currency?: CurrencyOption | null;
  readonly urlAllowlist?: readonly string[];
};

export type PaymentMethodTypeFieldsProps<T extends FieldValues> = {
  readonly type: PaymentMethodType;
  readonly control: Control<T>;
  readonly disabled?: boolean;
  readonly walletOptions?: readonly PaymentMethodCatalogOption[];
  readonly paymentLinkOptions?: readonly PaymentMethodCatalogOption[];
  readonly onlineAccountOptions?: readonly PaymentMethodCatalogOption[];
  readonly selectedWallet?: PaymentMethodCatalogOption | null;
  readonly selectedPaymentLink?: PaymentMethodCatalogOption | null;
  readonly selectedOnlineAccount?: PaymentMethodCatalogOption | null;
  readonly onWalletChangeAction?: (option: PaymentMethodCatalogOption) => void;
  readonly onPaymentLinkChangeAction?: (option: PaymentMethodCatalogOption) => void;
  readonly onOnlineAccountChangeAction?: (option: PaymentMethodCatalogOption) => void;
  readonly allowedCurrencyCodes?: readonly CurrencyCode[];
  readonly showCatalogMetadata?: boolean;
  readonly detailsPrefix?: string;
  readonly catalogPrefix?: string;
};

function resolveFieldName<T extends FieldValues>(prefix: string | undefined, field: string): FieldPath<T> {
  return (prefix ? `${prefix}.${field}` : field) as FieldPath<T>;
}

export function PaymentMethodTypeFields<T extends FieldValues>({
  type,
  control,
  disabled = false,
  walletOptions = [],
  paymentLinkOptions = [],
  onlineAccountOptions = [],
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
}: PaymentMethodTypeFieldsProps<T>): React.ReactNode {
  const t = useTranslations("ui.paymentMethod.typeFields");

  const renderCatalogMetadata = () => {
    if (!showCatalogMetadata) {
      return null;
    }

    return (
      <>
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "name")}
          control={control}
          label={t("name")}
          disabled={disabled}
          required
        />
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "description")}
          control={control}
          label={t("description")}
          disabled={disabled}
        />
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "instructions")}
          control={control}
          label={t("instructions")}
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
                label={t("urlAllowlist")}
                initialTags={[...(field.value ?? [])]}
                onChange={tags => field.onChange(tags)}
              />
            )}
          />
        ) : null}
      </>
    );
  };

  switch (type) {
    case PaymentMethodType.MobileWallet:
      return (
        <Stack spacing={2}>
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
                label={t("wallet")}
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
            control={control}
            label={t("phone")}
            disabled={disabled}
            required
            fullWidth
          />
        </Stack>
      );
    case PaymentMethodType.PaymentLink:
      return (
        <Stack spacing={2}>
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
                label={t("paymentLink")}
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
                label={t("url")}
                value={field.value ?? ""}
                disabled={disabled}
                required
                fullWidth
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
        <Stack spacing={2}>
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
                label={t("onlineAccount")}
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
                label={t("identifier")}
                value={field.value ?? ""}
                disabled={disabled}
                required
                fullWidth
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
        <Stack spacing={2}>
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "beneficiaryName")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={t("beneficiaryName")}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
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
                label={t("bankName")}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
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
                label={t("iban")}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
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
                label={t("swiftBic")}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
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
                label={t("accountNumber")}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
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
                label={t("routingNumber")}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
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
        <Stack spacing={2}>
          <Controller
            name={resolveFieldName<T>(detailsPrefix, "note")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={t("note")}
                value={field.value ?? ""}
                disabled={disabled}
                fullWidth
                multiline
                minRows={2}
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
