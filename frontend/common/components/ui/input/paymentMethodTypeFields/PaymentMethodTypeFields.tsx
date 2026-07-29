"use client";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { Controller, type FieldValues } from "react-hook-form";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
import { PaymentMethodSelect } from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodSelect";
import type { PaymentMethodTypeFieldsProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { resolveFieldName } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/utils";
import { PhoneFormField } from "@/frontend/common/components/ui/input/phoneInput/PhoneFormField";
import { TagInput } from "@/frontend/common/components/ui/input/tagInput/TagInput";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type {
  PaymentMethodCatalogFormValue,
  PaymentMethodDetailsFormValue,
  PaymentMethodTypeFieldsProps,
} from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";

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
}: Readonly<PaymentMethodTypeFieldsProps<T>>): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);
  const tTypeFields = t.typeFields;

  const renderCatalogMetadata = () => {
    if (!showCatalogMetadata) {
      return null;
    }

    return (
      <>
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "name")}
          control={control}
          label={tTypeFields.name}
          disabled={disabled}
          required
        />
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "description")}
          control={control}
          label={tTypeFields.description}
          disabled={disabled}
        />
        <LocalizedStringFormField
          name={resolveFieldName<T>(catalogPrefix, "instructions")}
          control={control}
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
            control={control}
            label={tTypeFields.phone}
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
                label={tTypeFields.beneficiaryName}
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
                label={tTypeFields.bankName}
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
                label={tTypeFields.iban}
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
                label={tTypeFields.swiftBic}
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
                label={tTypeFields.accountNumber}
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
                label={tTypeFields.routingNumber}
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
                label={tTypeFields.note}
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
