"use client";

import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import type { ChangeEvent } from "react";
import { useState } from "react";
import type { Control, FieldErrors, FieldPath, FieldValues, Path } from "react-hook-form";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { PaymentMethodTypeFields } from "@/frontend/common/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import { type PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { usePaymentMethodCatalogs } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";

export interface OnboardingPaymentMethodSectionProps<T extends FieldValues> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly direction: PaymentDirection;
  readonly methodFieldName: Path<T>;
  readonly addPaymentMethodLabel: string;
}

export function OnboardingPaymentMethodSection<T extends FieldValues>({
  control,
  errors,
  direction,
  methodFieldName,
  addPaymentMethodLabel,
}: Readonly<OnboardingPaymentMethodSectionProps<T>>) {
  const { setValue } = useFormContext<T>();

  const payoutMethod = useWatch({ control, name: methodFieldName });
  const hasMethod = Boolean(payoutMethod);
  const methodType = (payoutMethod as { type?: PaymentMethodType } | null)?.type ?? PaymentMethodType.BankTransfer;

  const { walletOptions, paymentLinkOptions, onlineAccountOptions } = usePaymentMethodCatalogs(direction);

  const [selectedWallet, setSelectedWallet] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedOnlineAccount, setSelectedOnlineAccount] = useState<PaymentMethodCatalogOption | null>(null);

  const detailsPrefix = `${methodFieldName}.details` as FieldPath<T>;
  const typeFieldName = `${methodFieldName}.type` as FieldPath<T>;

  const methodErrors = errors[methodFieldName as string] as FieldErrors<{ type?: { message?: string } }> | undefined;

  const enablePaymentMethod = () => {
    // initialize the payment method object using the form field name; setValue accepts the provided value without an explicit cast
    setValue(methodFieldName, {
      type: PaymentMethodType.BankTransfer,
      label: "",
      details: {},
    } as T[Path<T>]);
  };

  const disablePaymentMethod = () => {
    // Clear the payment method value
    setValue(methodFieldName, null as T[Path<T>]);
  };

  const handleCheckboxChange = (_e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    if (checked) {
      enablePaymentMethod();
    } else {
      disablePaymentMethod();
    }
  };

  const rawTypeError = methodErrors?.type?.message;
  const typeErrorMessage =
    rawTypeError == null ? undefined : typeof rawTypeError === "string" ? rawTypeError : JSON.stringify(rawTypeError);

  return (
    <Stack spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <FormControlLabel
        control={<Checkbox checked={hasMethod} onChange={handleCheckboxChange} />}
        label={addPaymentMethodLabel}
      />

      {hasMethod ? (
        <>
          <Controller
            name={typeFieldName}
            control={control}
            render={({ field }) => (
              <PaymentMethodTypeSelector
                type={field.value ?? PaymentMethodType.BankTransfer}
                setTypeAction={value => {
                  if (value) field.onChange(value);
                }}
                fullWidth
              />
            )}
          />
          <PaymentMethodTypeFields
            type={methodType}
            control={control}
            detailsPrefix={detailsPrefix}
            walletOptions={walletOptions}
            paymentLinkOptions={paymentLinkOptions}
            onlineAccountOptions={onlineAccountOptions}
            selectedWallet={selectedWallet}
            selectedPaymentLink={selectedPaymentLink}
            selectedOnlineAccount={selectedOnlineAccount}
            onWalletChangeAction={option => {
              setSelectedWallet(option);
              setValue(`${methodFieldName}.details.walletId` as FieldPath<T>, option.id as T[Path<T>]);
            }}
            onPaymentLinkChangeAction={option => {
              setSelectedPaymentLink(option);
              setValue(`${methodFieldName}.details.paymentLinkId` as FieldPath<T>, option.id as T[Path<T>]);
            }}
            onOnlineAccountChangeAction={option => {
              setSelectedOnlineAccount(option);
              setValue(`${methodFieldName}.details.onlineAccountId` as FieldPath<T>, option.id as T[Path<T>]);
            }}
          />
          {typeErrorMessage ? (
            <span style={{ color: "var(--mui-palette-error-main)", fontSize: 12 }}>{typeErrorMessage}</span>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
