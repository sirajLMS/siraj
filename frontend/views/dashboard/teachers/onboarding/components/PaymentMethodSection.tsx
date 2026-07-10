"use client";

import { Stack } from "@mui/material";
import { useState } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { PaymentMethodTypeFields } from "@/frontend/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import { PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/lib/payment-method";
import { usePaymentMethodCatalogs } from "@/frontend/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

interface PaymentMethodSectionProps {
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
}

export function PaymentMethodSection({ control, errors }: Readonly<PaymentMethodSectionProps>) {
  const { setValue } = useFormContext<TeacherOnboardingFormData>();
  const methodType = useWatch({ control, name: "payoutMethod.type" }) ?? PaymentMethodType.BankTransfer;

  const { walletOptions, paymentLinkOptions, onlineAccountOptions } = usePaymentMethodCatalogs(
    PaymentDirection.Payout
  );

  const [selectedWallet, setSelectedWallet] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedOnlineAccount, setSelectedOnlineAccount] = useState<PaymentMethodCatalogOption | null>(null);

  return (
    <Stack spacing={3}>
      <Controller
        name="payoutMethod.type"
        control={control}
        render={({ field }) => (
          <PaymentMethodTypeSelector
            type={field.value}
            setTypeAction={value => {
              if (value) field.onChange(value);
            }}
            required
            fullWidth
          />
        )}
      />
      <PaymentMethodTypeFields
        type={methodType}
        control={control}
        detailsPrefix="payoutMethod.details"
        walletOptions={walletOptions}
        paymentLinkOptions={paymentLinkOptions}
        onlineAccountOptions={onlineAccountOptions}
        selectedWallet={selectedWallet}
        selectedPaymentLink={selectedPaymentLink}
        selectedOnlineAccount={selectedOnlineAccount}
        onWalletChangeAction={option => {
          setSelectedWallet(option);
          setValue("payoutMethod.details.walletId", option.id);
        }}
        onPaymentLinkChangeAction={option => {
          setSelectedPaymentLink(option);
          setValue("payoutMethod.details.paymentLinkId", option.id);
        }}
        onOnlineAccountChangeAction={option => {
          setSelectedOnlineAccount(option);
          setValue("payoutMethod.details.onlineAccountId", option.id);
        }}
      />
      {errors.payoutMethod?.type?.message ? (
        <span style={{ color: "var(--mui-palette-error-main)", fontSize: 12 }}>{errors.payoutMethod.type.message}</span>
      ) : null}
    </Stack>
  );
}
