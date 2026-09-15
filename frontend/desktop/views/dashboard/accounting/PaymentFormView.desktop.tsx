"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress, FormHelperText, Stack, TextField } from "@mui/material";
import Link from "next/link";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
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
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

const spinIcon = (
  <SyncOutlined
    sx={{ animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }}
  />
);

interface FormActionsProps {
  readonly isSubmitting: boolean;
  readonly submitLabel: string;
  readonly savingLabel: string;
  readonly cancelLabel: string;
}

function FormActions({ isSubmitting, submitLabel, savingLabel, cancelLabel }: Readonly<FormActionsProps>) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
      <Link href="/accounting/payments" style={{ textDecoration: "none" }}>
        <DesktopPrimaryPageAction variant="text" color="inherit" disabled={isSubmitting}>
          {cancelLabel}
        </DesktopPrimaryPageAction>
      </Link>
      <DesktopPrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        startIcon={isSubmitting ? spinIcon : <SaveOutlined />}
      >
        {isSubmitting ? savingLabel : submitLabel}
      </DesktopPrimaryPageAction>
    </Stack>
  );
}

interface PaymentNoteControllerFieldProps<TValues extends FieldValues, TTransformed> {
  readonly control: Control<TValues, undefined, TTransformed>;
  readonly name: FieldPath<TValues>;
  readonly label: string;
  readonly placeholder: string;
}

/** Note textarea bound via react-hook-form Controller; shared by the create and edit payment forms. */
function PaymentNoteControllerField<TValues extends FieldValues, TTransformed>({
  control,
  name,
  label,
  placeholder,
}: Readonly<PaymentNoteControllerFieldProps<TValues, TTransformed>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <PaymentNoteField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          label={label}
          placeholder={placeholder}
        />
      )}
    />
  );
}

export function PaymentFormDesktop(props: Readonly<UsePaymentFormViewModel>) {
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
    submitError,
    existing,
    lastPaymentCurrency,
    currencyMismatch,
    onSubmit,
    onEditSubmit,
    onDismissSuccess,
    onDismissError,
  } = props;

  if (isEditing && loadingExisting) {
    return (
      <DesktopPageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={36} />
        </Box>
      </DesktopPageContainer>
    );
  }

  const title = isEditing ? t.editPayment : t.addPayment;

  const gatewayFieldArgs = { label: t.form.paymentGateway, localizedGateways: t.gateways };

  const formActions = (
    <FormActions
      isSubmitting={isSubmitting}
      submitLabel={t.form.submit}
      savingLabel={t.form.saving}
      cancelLabel={t.form.cancel}
    />
  );

  const breadcrumbs = [
    { label: t.pageTitle, href: "/accounting/payments" },
    { label: title, current: true },
  ];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={title}
        subtitle={isEditing ? t.editFormSubtitle : t.formSubtitle}
        breadcrumbs={breadcrumbs}
      />

      {isEditing ? (
        /* ── EDIT: only hours / gateway / note stay mutable (invoice snapshot locked) ── */
        <Box
          component="form"
          onSubmit={handleEditSubmit(onEditSubmit)}
          noValidate
          sx={{ maxWidth: 1100, width: "100%", mx: "auto" }}
        >
          <Stack spacing={3}>
            <DesktopSectionPanel title={t.paymentDetails}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
                  <TextField
                    size="small"
                    label={t.form.student}
                    value={existing?.studentName ?? "—"}
                    disabled
                    sx={theme => ({ ...paymentReadOnlyFieldSx(theme), flex: 1, minWidth: 220 })}
                  />
                  <TextField
                    size="small"
                    label={`${t.columns.paid} / ${t.form.currency}`}
                    value={existing ? `${formatAccountingMoney(existing.amount)} ${existing.currency ?? ""}` : "—"}
                    disabled
                    sx={theme => ({ ...paymentReadOnlyFieldSx(theme), flex: 1, minWidth: 170 })}
                  />
                </Stack>

                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
                  <PaymentDecimalControllerField
                    control={editControl}
                    name="creditHours"
                    label={t.form.credit}
                    inputStep={0.5}
                    inputMin={0.5}
                    sx={{ flex: 1, minWidth: 220 }}
                  />
                  <Controller
                    name="paymentGateway"
                    control={editControl}
                    render={({ field }) => (
                      <GatewaySelectField
                        value={field.value}
                        onChange={field.onChange}
                        {...gatewayFieldArgs}
                        sx={{ flex: 1, minWidth: 240 }}
                      />
                    )}
                  />
                </Stack>

                <PaymentNoteControllerField
                  control={editControl}
                  name="paymentNote"
                  label={t.form.note}
                  placeholder={t.form.notePlaceholder}
                />
              </Stack>
            </DesktopSectionPanel>

            {formActions}
          </Stack>
        </Box>
      ) : (
        /* ── CREATE: full form with package auto-fill (hours/amount/currency stay editable) ── */
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ maxWidth: 1100, width: "100%", mx: "auto" }}
        >
          <Stack spacing={3}>
            <Stack direction="row" spacing={3} sx={{ alignItems: "flex-start" }}>
              <DesktopSectionPanel title={t.form.student} sx={{ flex: 1, minWidth: 0 }}>
                <PaymentStudentControllerField
                  control={control}
                  label={t.form.student}
                  placeholder={t.form.studentPlaceholder}
                  StudentAutocomplete={StudentAutocompleteDesktop}
                />
              </DesktopSectionPanel>

              <DesktopSectionPanel title={t.form.packagePlan} sx={{ flex: 1, minWidth: 0 }}>
                <Stack spacing={3}>
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
                        minWidth={340}
                      />
                    )}
                  />
                  {errors.packagePlanId ? <FormHelperText error>{errors.packagePlanId.message}</FormHelperText> : null}

                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
                    <PaymentDecimalControllerField
                      control={control}
                      name="creditHours"
                      label={t.form.credit}
                      inputStep={0.5}
                      inputMin={0.5}
                      sx={{ flex: 1, minWidth: 150 }}
                    />
                    <PaymentDecimalControllerField
                      control={control}
                      name="amount"
                      label={t.form.paid}
                      inputStep={0.01}
                      inputMin={0}
                      sx={{ flex: 1, minWidth: 150 }}
                    />
                  </Stack>

                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ width: "100%" }}>
                        <CurrencySelect
                          currency={getCurrencyByCode(field.value) ?? null}
                          setCurrencyAction={selected => field.onChange(selected.code)}
                          onBlurAction={field.onBlur}
                          label={t.form.currency}
                          error={Boolean(errors.currency)}
                          helperText={errors.currency?.message}
                          fullWidth
                        />
                      </Box>
                    )}
                  />

                  <CurrencyMismatchAlert
                    active={currencyMismatch}
                    lastPaymentCurrency={lastPaymentCurrency}
                    message={t.currencyWarning}
                  />
                </Stack>
              </DesktopSectionPanel>
            </Stack>

            <DesktopSectionPanel title={t.paymentDetails}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2, alignItems: "center" }}>
                  <Controller
                    name="paymentGateway"
                    control={control}
                    render={({ field }) => (
                      <GatewaySelectField
                        value={field.value}
                        onChange={field.onChange}
                        {...gatewayFieldArgs}
                        sx={{ minWidth: 220 }}
                      />
                    )}
                  />

                  <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field }) => (
                      <DesktopAppDatePicker
                        label={t.form.paymentDate}
                        value={field.value ? new Date(field.value) : null}
                        onChange={date => field.onChange(date ? date.toISOString().slice(0, 10) : "")}
                        slotProps={{ textField: { size: "small", sx: { minWidth: 200 } } }}
                      />
                    )}
                  />

                  <PaymentPaidStatusControllerField
                    control={control}
                    onLabel={t.form.paidToggleOn}
                    offLabel={t.form.paidToggleOff}
                  />
                </Stack>

                <PaymentNoteControllerField
                  control={control}
                  name="paymentNote"
                  label={t.form.note}
                  placeholder={t.form.notePlaceholder}
                />
              </Stack>
            </DesktopSectionPanel>

            {formActions}
          </Stack>
        </Box>
      )}

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
      <DesktopFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
    </DesktopPageContainer>
  );
}
