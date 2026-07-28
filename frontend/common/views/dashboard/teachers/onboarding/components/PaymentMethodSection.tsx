"use client";

import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { useState } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { PaymentMethodTypeFields } from "@/frontend/common/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import { PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { usePaymentMethodCatalogs } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import type { TeacherOnboardingLabels } from "@/shared/locale";

interface PaymentMethodSectionProps {
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: Pick<TeacherOnboardingLabels, "sections">;
}

export function PaymentMethodSection({ control, errors, labels }: Readonly<PaymentMethodSectionProps>) {
  const { setValue } = useFormContext<TeacherOnboardingFormData>();

  const payoutMethod = useWatch({ control, name: "payoutMethod" });
  const hasMethod = Boolean(payoutMethod);
  const methodType = payoutMethod?.type ?? PaymentMethodType.BankTransfer;

  const { walletOptions, paymentLinkOptions, onlineAccountOptions } = usePaymentMethodCatalogs(PaymentDirection.Payout);

  const [selectedWallet, setSelectedWallet] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedOnlineAccount, setSelectedOnlineAccount] = useState<PaymentMethodCatalogOption | null>(null);

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      setValue("payoutMethod", {
        type: PaymentMethodType.BankTransfer,
        label: "",
        details: {},
      });
    } else {
      setValue("payoutMethod", null);
    }
  };

  return (
    <Stack spacing={3}>
      <FormControlLabel
        control={
          <Checkbox
            checked={hasMethod}
            onChange={e => {
              handleToggle(e.target.checked);
            }}
          />
        }
        label={labels.sections.addPaymentMethod}
      />

      {hasMethod ? (
        <>
          <Controller
            name="payoutMethod.type"
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
            <span style={{ color: "var(--mui-palette-error-main)", fontSize: 12 }}>
              {errors.payoutMethod.type.message}
            </span>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
