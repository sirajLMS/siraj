"use client";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { Controller, type FieldValues } from "react-hook-form";
import type { PaymentMethodTypeFieldsContext } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared.types";
import { resolveFieldName } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/utils";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";

export function CatalogMetadataFields<T extends FieldValues>({
  ctx,
}: {
  readonly ctx: PaymentMethodTypeFieldsContext<T>;
}): React.ReactNode {
  const { type, control, disabled, catalogPrefix, allowedCurrencyCodes, showCatalogMetadata, tTypeFields, slots } = ctx;
  if (!showCatalogMetadata) {
    return null;
  }

  const { LocalizedStringFormField, CountryAutocomplete, CurrencySelect, TagInput } = slots;

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
}

function LtrTextFieldController<T extends FieldValues>({
  ctx,
  fieldName,
  label,
}: {
  readonly ctx: PaymentMethodTypeFieldsContext<T>;
  readonly fieldName: string;
  readonly label: string;
}): React.ReactNode {
  return (
    <Controller
      key={fieldName}
      name={resolveFieldName<T>(ctx.detailsPrefix, fieldName)}
      control={ctx.control}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          value={field.value ?? ""}
          disabled={ctx.disabled}
          fullWidth
          {...ctx.sizeProp}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          onChange={event => field.onChange(event.target.value)}
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
      )}
    />
  );
}

export function BankTransferFields<T extends FieldValues>({
  ctx,
}: {
  readonly ctx: PaymentMethodTypeFieldsContext<T>;
}): React.ReactNode {
  return (
    <Stack spacing={ctx.stackSpacingProp} sx={ctx.stackSx}>
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "beneficiaryName")}
        control={ctx.control}
        render={({ field, fieldState }) => (
          <TextField
            label={ctx.tTypeFields.beneficiaryName}
            value={field.value ?? ""}
            disabled={ctx.disabled}
            fullWidth
            {...ctx.sizeProp}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            onChange={event => field.onChange(event.target.value)}
          />
        )}
      />
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "bankName")}
        control={ctx.control}
        render={({ field, fieldState }) => (
          <TextField
            label={ctx.tTypeFields.bankName}
            value={field.value ?? ""}
            disabled={ctx.disabled}
            fullWidth
            {...ctx.sizeProp}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            onChange={event => field.onChange(event.target.value)}
          />
        )}
      />
      <LtrTextFieldController ctx={ctx} fieldName="iban" label={ctx.tTypeFields.iban} />
      <LtrTextFieldController ctx={ctx} fieldName="swiftBic" label={ctx.tTypeFields.swiftBic} />
      <LtrTextFieldController ctx={ctx} fieldName="accountNumber" label={ctx.tTypeFields.accountNumber} />
      <LtrTextFieldController ctx={ctx} fieldName="routingNumber" label={ctx.tTypeFields.routingNumber} />
    </Stack>
  );
}

export function CashFields<T extends FieldValues>({
  ctx,
}: {
  readonly ctx: PaymentMethodTypeFieldsContext<T>;
}): React.ReactNode {
  return (
    <Stack spacing={ctx.stackSpacingProp} sx={ctx.stackSx}>
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "note")}
        control={ctx.control}
        render={({ field, fieldState }) => (
          <TextField
            label={ctx.tTypeFields.note}
            value={field.value ?? ""}
            disabled={ctx.disabled}
            fullWidth
            multiline
            minRows={2}
            {...ctx.sizeProp}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            onChange={event => field.onChange(event.target.value)}
          />
        )}
      />
    </Stack>
  );
}
