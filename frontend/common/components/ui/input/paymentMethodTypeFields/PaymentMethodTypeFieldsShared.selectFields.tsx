"use client";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { Controller, type FieldValues } from "react-hook-form";
import { CatalogMetadataFields } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared.parts";
import type { PaymentMethodTypeFieldsContext } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared.types";
import { resolveFieldName } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/utils";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

type MobileWalletFieldsProps<T extends FieldValues = FieldValues> = {
  readonly ctx: PaymentMethodTypeFieldsContext<T>;
  readonly walletOptions: readonly PaymentMethodCatalogOption[];
  readonly selectedWallet: PaymentMethodCatalogOption | null | undefined;
  readonly onWalletChangeAction: ((option: PaymentMethodCatalogOption) => void) | undefined;
};

export function MobileWalletFields<T extends FieldValues>({
  ctx,
  walletOptions,
  selectedWallet,
  onWalletChangeAction,
}: MobileWalletFieldsProps<T>): React.ReactNode {
  const { PaymentMethodSelect, PhoneFormField } = ctx.slots;
  return (
    <Stack spacing={ctx.stackSpacingProp} sx={ctx.stackSx}>
      <CatalogMetadataFields ctx={ctx} />
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "walletId")}
        control={ctx.control}
        render={({ fieldState }) => (
          <PaymentMethodSelect
            option={selectedWallet ?? null}
            options={walletOptions}
            setOptionAction={option => onWalletChangeAction?.(option)}
            type={PaymentMethodType.MobileWallet}
            label={ctx.tTypeFields.wallet}
            disabled={ctx.disabled}
            required
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />
      <PhoneFormField
        name={resolveFieldName<T>(ctx.detailsPrefix, "phone")}
        control={ctx.control}
        label={ctx.tTypeFields.phone}
        disabled={ctx.disabled}
        required
        fullWidth
      />
    </Stack>
  );
}

type PaymentLinkFieldsProps<T extends FieldValues = FieldValues> = {
  readonly ctx: PaymentMethodTypeFieldsContext<T>;
  readonly paymentLinkOptions: readonly PaymentMethodCatalogOption[];
  readonly selectedPaymentLink: PaymentMethodCatalogOption | null | undefined;
  readonly onPaymentLinkChangeAction: ((option: PaymentMethodCatalogOption) => void) | undefined;
};

export function PaymentLinkFields<T extends FieldValues>({
  ctx,
  paymentLinkOptions,
  selectedPaymentLink,
  onPaymentLinkChangeAction,
}: PaymentLinkFieldsProps<T>): React.ReactNode {
  return (
    <Stack spacing={ctx.stackSpacingProp} sx={ctx.stackSx}>
      <CatalogMetadataFields ctx={ctx} />
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "paymentLinkId")}
        control={ctx.control}
        render={({ fieldState }) => (
          <ctx.slots.PaymentMethodSelect
            option={selectedPaymentLink ?? null}
            options={paymentLinkOptions}
            setOptionAction={option => onPaymentLinkChangeAction?.(option)}
            type={PaymentMethodType.PaymentLink}
            label={ctx.tTypeFields.paymentLink}
            disabled={ctx.disabled}
            required
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "url")}
        control={ctx.control}
        render={({ field, fieldState }) => (
          <TextField
            label={ctx.tTypeFields.url}
            value={field.value ?? ""}
            disabled={ctx.disabled}
            required
            fullWidth
            {...ctx.sizeProp}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            onChange={event => field.onChange(event.target.value)}
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
        )}
      />
    </Stack>
  );
}

type OnlineAccountFieldsProps<T extends FieldValues = FieldValues> = {
  readonly ctx: PaymentMethodTypeFieldsContext<T>;
  readonly onlineAccountOptions: readonly PaymentMethodCatalogOption[];
  readonly selectedOnlineAccount: PaymentMethodCatalogOption | null | undefined;
  readonly onOnlineAccountChangeAction: ((option: PaymentMethodCatalogOption) => void) | undefined;
};

export function OnlineAccountFields<T extends FieldValues>({
  ctx,
  onlineAccountOptions,
  selectedOnlineAccount,
  onOnlineAccountChangeAction,
}: OnlineAccountFieldsProps<T>): React.ReactNode {
  return (
    <Stack spacing={ctx.stackSpacingProp} sx={ctx.stackSx}>
      <CatalogMetadataFields ctx={ctx} />
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "onlineAccountId")}
        control={ctx.control}
        render={({ fieldState }) => (
          <ctx.slots.PaymentMethodSelect
            option={selectedOnlineAccount ?? null}
            options={onlineAccountOptions}
            setOptionAction={option => onOnlineAccountChangeAction?.(option)}
            type={PaymentMethodType.OnlineAccount}
            label={ctx.tTypeFields.onlineAccount}
            disabled={ctx.disabled}
            required
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />
      <Controller
        name={resolveFieldName<T>(ctx.detailsPrefix, "identifier")}
        control={ctx.control}
        render={({ field, fieldState }) => (
          <TextField
            label={ctx.tTypeFields.identifier}
            value={field.value ?? ""}
            disabled={ctx.disabled}
            required
            fullWidth
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
