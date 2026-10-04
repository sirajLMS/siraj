"use client";

import { Stack } from "@mui/material";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import {
  PaymentDecimalControllerField,
  PaymentPaidStatusControllerField,
  PaymentStudentControllerField,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared";
import { PackagePlanAutocomplete } from "@/frontend/common/views/dashboard/accounting/components/PackagePlanAutocomplete";
import {
  CurrencyMismatchAlert,
  GatewaySelectField,
  PaymentNoteField,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentFormFields";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { MobileContentInset, MobileContentStack } from "@/frontend/mobile/components/ui";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { PaymentFormSubmitButtonsMobile } from "@/frontend/mobile/views/dashboard/accounting/PaymentFormView.mobile.parts";

function PaymentCreditAmountRow({ control, t }: Readonly<UsePaymentFormViewModel>) {
  return (
    <Stack sx={{ flexDirection: "row" }} spacing={1.5}>
      <PaymentDecimalControllerField
        control={control}
        name="creditHours"
        label={t.form.credit}
        inputStep={0.5}
        inputMin={0.5}
        sx={{ flex: 1 }}
      />
      <PaymentDecimalControllerField
        control={control}
        name="amount"
        label={t.form.paid}
        inputStep={0.01}
        inputMin={0}
        sx={{ flex: 1 }}
      />
    </Stack>
  );
}

function PaymentPackagePlanField({ control, t }: Readonly<UsePaymentFormViewModel>) {
  return (
    <Controller
      name="packagePlanId"
      control={control}
      render={({ field }) => (
        <PackagePlanAutocomplete
          value={field.value}
          onChange={field.onChange}
          label={t.form.packagePlan}
          placeholder={t.form.packagePlanPlaceholder}
          adhocLabel={t.form.packagePlanAdhoc}
          size="small"
          sx={{ width: "100%", minWidth: 0 }}
        />
      )}
    />
  );
}

export function PaymentCreateFormMobile(props: Readonly<UsePaymentFormViewModel>) {
  const { t, control, errors, handleSubmit, isSubmitting, currencyMismatch, lastPaymentCurrency, onSubmit } = props;
  const gatewayFieldArgs = { label: t.form.paymentGateway, localizedGateways: t.gateways };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <MobileContentInset>
        <MobileContentStack gap={2.5} paddingBottom={6}>
          <PaymentStudentControllerField
            control={control}
            label={t.form.student}
            placeholder={t.form.studentPlaceholder}
            StudentAutocomplete={StudentAutocompleteMobile}
          />

          <PaymentPackagePlanField {...props} />

          <PaymentCreditAmountRow {...props} />

          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <CurrencySelect
                currency={getCurrencyByCode(field.value) ?? null}
                setCurrencyAction={selected => field.onChange(selected.code)}
                onBlurAction={field.onBlur}
                label={t.form.currency}
                error={Boolean(errors.currency)}
                helperText={errors.currency?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="paymentGateway"
            control={control}
            render={({ field }) => (
              <GatewaySelectField
                value={field.value}
                onChange={field.onChange}
                {...gatewayFieldArgs}
                sx={{ width: "100%" }}
              />
            )}
          />

          <CurrencyMismatchAlert
            active={currencyMismatch}
            lastPaymentCurrency={lastPaymentCurrency}
            message={t.currencyWarning}
          />

          <Controller
            name="paymentDate"
            control={control}
            render={({ field }) => (
              <MobileAppDatePicker
                label={t.form.paymentDate}
                value={field.value ? new Date(field.value) : null}
                onChange={date => field.onChange(date ? date.toISOString().slice(0, 10) : "")}
                slotProps={{ textField: { size: "small" } }}
              />
            )}
          />

          <PaymentPaidStatusControllerField
            control={control}
            onLabel={t.form.paidToggleOn}
            offLabel={t.form.paidToggleOff}
          />

          <Controller
            name="paymentNote"
            control={control}
            render={({ field }) => (
              <PaymentNoteField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                label={t.form.note}
                placeholder={t.form.notePlaceholder}
              />
            )}
          />

          <PaymentFormSubmitButtonsMobile
            isSubmitting={isSubmitting}
            submitLabel={t.form.submit}
            savingLabel={t.form.saving}
            cancelLabel={t.form.cancel}
          />
        </MobileContentStack>
      </MobileContentInset>
    </form>
  );
}
