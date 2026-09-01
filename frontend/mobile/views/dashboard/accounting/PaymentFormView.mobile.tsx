"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import { Controller } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import { paymentReadOnlyFieldSx } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared.styles";
import { PackagePlanSelectShared } from "@/frontend/common/views/dashboard/accounting/components/PackagePlanSelectShared";
import {
  CurrencyMismatchAlert,
  GatewaySelectField,
  PaymentNoteField,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentFormFields";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export function PaymentFormMobile(props: Readonly<UsePaymentFormViewModel>) {
  const {
    t,
    control,
    editControl,
    errors,
    editErrors,
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
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <SyncOutlined /> : <SaveOutlined />}
      >
        {isSubmitting ? t.form.saving : t.form.submit}
      </Button>
      <Button
        variant="text"
        color="inherit"
        onClick={() => router.push("/accounting/payments")}
        disabled={isSubmitting}
      >
        {t.form.cancel}
      </Button>
    </>
  );

  // Keep the resolved student option (id + display name) in local state so the
  // autocomplete shows the human-readable name instead of the raw id after
  // re-renders triggered by other form fields (e.g. package auto-fill).
  const [selectedStudent, setSelectedStudent] = useState<PersonOption | null>(null);

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
        <Box component="form" onSubmit={handleEditSubmit(onEditSubmit)} noValidate>
          <Stack spacing={2.5} sx={{ px: 2, pb: 6 }}>
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

            <Controller
              name="creditHours"
              control={editControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  type="number"
                  label={t.form.credit}
                  error={Boolean(editErrors.creditHours)}
                  helperText={editErrors.creditHours?.message}
                  slotProps={{ htmlInput: { step: 0.5, min: 0.5, inputMode: "decimal" } }}
                />
              )}
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
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5} sx={{ px: 2, pb: 6 }}>
            <Controller
              name="studentId"
              control={control}
              render={({ field }) => (
                <StudentAutocompleteMobile
                  value={selectedStudent}
                  onChange={option => {
                    setSelectedStudent(option ?? null);
                    field.onChange(option?.id ?? "");
                  }}
                  label={t.form.student}
                  placeholder={t.form.studentPlaceholder}
                  error={Boolean(errors.studentId)}
                  helperText={errors.studentId?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="packagePlanId"
              control={control}
              render={({ field }) => (
                <PackagePlanSelectShared
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
              <Controller
                name="creditHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    type="number"
                    label={t.form.credit}
                    error={Boolean(errors.creditHours)}
                    helperText={errors.creditHours?.message}
                    slotProps={{ htmlInput: { step: 0.5, min: 0.5, inputMode: "decimal" } }}
                    sx={{ flex: 1 }}
                  />
                )}
              />
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    type="number"
                    label={t.form.paid}
                    error={Boolean(errors.amount)}
                    helperText={errors.amount?.message}
                    slotProps={{ htmlInput: { step: 0.01, min: 0, inputMode: "decimal" } }}
                    sx={{ flex: 1 }}
                  />
                )}
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

            <Controller
              name="isPaidStatusOn"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                    />
                  }
                  label={field.value ? t.form.paidToggleOn : t.form.paidToggleOff}
                  sx={{ mx: 0, py: 0.5 }}
                />
              )}
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
          </Stack>
        </Box>
      )}

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}
