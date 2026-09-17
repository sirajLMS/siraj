"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Stack, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import {
  PaymentDecimalControllerField,
  PaymentPaidStatusControllerField,
  PaymentStudentControllerField,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared";
import { paymentReadOnlyFieldSx } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared.styles";
import { PackagePlanAutocomplete } from "@/frontend/common/views/dashboard/accounting/components/PackagePlanAutocomplete";
import {
  CurrencyMismatchAlert,
  GatewaySelectField,
  PaymentNoteField,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentFormFields";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import {
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
} from "@/frontend/mobile/components/ui";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export function PaymentFormMobile(props: Readonly<UsePaymentFormViewModel>) {
  const {
    t,
    control,
    editControl,
    errors,
    handleSubmit,
    handleEditSubmit,
    isSubmitting,
    isEditing,
    loadingExisting,
    showSuccess,
    existing,
    lastPaymentCurrency,
    currencyMismatch,
    onSubmit,
    onEditSubmit,
    onDismissSuccess,
  } = props;
  const router = useRouter();

  const gatewayFieldArgs = { label: t.form.paymentGateway, localizedGateways: t.gateways };

  const submitButtons = (
    <>
      <MobilePrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <SyncOutlined /> : <SaveOutlined />}
      >
        {isSubmitting ? t.form.saving : t.form.submit}
      </MobilePrimaryPageAction>
      <MobilePrimaryPageAction
        variant="text"
        color="inherit"
        onClick={() => router.push("/accounting/payments")}
        disabled={isSubmitting}
      >
        {t.form.cancel}
      </MobilePrimaryPageAction>
    </>
  );

  if (isEditing && loadingExisting) {
    return (
      <MobilePageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      </MobilePageContainer>
    );
  }

  const title = isEditing ? t.editPayment : t.addPayment;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={title} subtitle={isEditing ? t.editFormSubtitle : t.formSubtitle} />

      {isEditing ? (
        <form onSubmit={handleEditSubmit(onEditSubmit)} noValidate>
          <MobileContentInset>
            <MobileContentStack gap={2.5} paddingBottom={6}>
              <TextField
                size="small"
                label={t.form.student}
                value={existing?.studentName ?? "—"}
                disabled
                sx={paymentReadOnlyFieldSx}
              />
              <TextField
                size="small"
                label={`${t.columns.paid} / ${t.form.currency}`}
                value={existing ? `${Number(existing.amount ?? 0).toFixed(2)} ${existing.currency ?? ""}` : "—"}
                disabled
                sx={paymentReadOnlyFieldSx}
              />

              <PaymentDecimalControllerField
                control={editControl}
                name="creditHours"
                label={t.form.credit}
                inputStep={0.5}
                inputMin={0.5}
              />

              <Controller
                name="paymentNote"
                control={editControl}
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

              <Controller
                name="paymentGateway"
                control={editControl}
                render={({ field }) => (
                  <GatewaySelectField value={field.value} onChange={field.onChange} {...gatewayFieldArgs} />
                )}
              />

              {submitButtons}
            </MobileContentStack>
          </MobileContentInset>
        </form>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <MobileContentInset>
            <MobileContentStack gap={2.5} paddingBottom={6}>
              <PaymentStudentControllerField
                control={control}
                label={t.form.student}
                placeholder={t.form.studentPlaceholder}
                StudentAutocomplete={StudentAutocompleteMobile}
              />

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

              <Stack direction="row" spacing={1.5}>
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

              {submitButtons}
            </MobileContentStack>
          </MobileContentInset>
        </form>
      )}

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}
