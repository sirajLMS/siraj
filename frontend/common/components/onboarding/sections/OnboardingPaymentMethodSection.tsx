"use client";

import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { type ChangeEvent, useState } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormSetValue,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { PaymentMethodTypeFields } from "@/frontend/common/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import { resolveFieldName } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/utils";
import { type PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { usePaymentMethodCatalogs } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";

type MethodErrorShape = { type?: { message?: string } };
type MethodErrors = FieldErrors<MethodErrorShape>;

/** Narrows an unknown error entry to a nested FieldErrors object for the payment method field. */
function isMethodErrors(value: unknown): value is MethodErrors {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Runtime guard that trusts the caller: validating a generic form field value
 * against T[Path<T>] is not practical, so any value is accepted and forwarded
 * to setValue. This keeps call sites free of unsafe type assertions.
 */
function isFieldValue<T extends FieldValues>(_value: unknown): _value is T[Path<T>] {
  return true;
}

/** Sets a form field value without requiring an unsafe type assertion at the call site. */
function setFieldValue<T extends FieldValues>(setValue: UseFormSetValue<T>, name: Path<T>, value: unknown): void {
  if (isFieldValue<T>(value)) {
    setValue(name, value);
  }
}

/** Resolves a raw type error value into a display-friendly string (or undefined when absent). */
function resolveTypeErrorMessage(rawTypeError: unknown): string | undefined {
  if (rawTypeError == null) {
    return undefined;
  }
  if (typeof rawTypeError === "string") {
    return rawTypeError;
  }
  return JSON.stringify(rawTypeError);
}

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

  const detailsPrefix = `${methodFieldName}.details`;
  const typeFieldName = resolveFieldName<T>(methodFieldName, "type");

  const errorEntry = (errors as Record<string, unknown>)[methodFieldName];
  const methodErrors = isMethodErrors(errorEntry) ? errorEntry : undefined;

  const enablePaymentMethod = () => {
    // initialize the payment method object using the form field name
    setFieldValue(setValue, methodFieldName, {
      type: PaymentMethodType.BankTransfer,
      label: "",
      details: {},
    });
  };

  const disablePaymentMethod = () => {
    // Clear the payment method value
    setFieldValue(setValue, methodFieldName, null);
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      enablePaymentMethod();
    } else {
      disablePaymentMethod();
    }
  };

  const rawTypeError = methodErrors?.type?.message;
  const typeErrorMessage = resolveTypeErrorMessage(rawTypeError);

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
              setFieldValue(setValue, resolveFieldName<T>(detailsPrefix, "walletId"), option.id);
            }}
            onPaymentLinkChangeAction={option => {
              setSelectedPaymentLink(option);
              setFieldValue(setValue, resolveFieldName<T>(detailsPrefix, "paymentLinkId"), option.id);
            }}
            onOnlineAccountChangeAction={option => {
              setSelectedOnlineAccount(option);
              setFieldValue(setValue, resolveFieldName<T>(detailsPrefix, "onlineAccountId"), option.id);
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
