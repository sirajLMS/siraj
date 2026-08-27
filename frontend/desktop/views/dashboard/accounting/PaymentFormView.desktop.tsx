"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { CurrencyCode, PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { PackagePlanSelectShared } from "@/frontend/common/views/dashboard/accounting/components/PackagePlanSelectShared";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

const GATEWAY_OPTIONS: readonly PaymentGateway[] = [
  PaymentGateway.None,
  PaymentGateway.Paypal,
  PaymentGateway.WesternUnion,
  PaymentGateway.Bank,
  PaymentGateway.Other,
];

const CURRENCY_OPTIONS: readonly CurrencyCode[] = [
  CurrencyCode.Egp,
  CurrencyCode.Usd,
  CurrencyCode.Sar,
  CurrencyCode.Aed,
];

const CURRENCY_LABELS: Record<string, string> = {
  Egp: "EGP",
  Usd: "USD",
  Sar: "SAR",
  Aed: "AED",
};

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
        <DesktopPrimaryPageAction variant="outlined" disabled={isSubmitting}>
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

export function PaymentFormDesktop(props: Readonly<UsePaymentFormViewModel>) {
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
    submitError,
    existing,
    onSubmit,
    onEditSubmit,
    onDismissSuccess,
    onDismissError,
  } = props;

  // Keep the resolved student option (id + display name) in local state so the
  // autocomplete shows the human-readable name instead of the raw id after
  // re-renders triggered by other form fields (e.g. package auto-fill).
  const [selectedStudent, setSelectedStudent] = useState<PersonOption | null>(null);

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

  const breadcrumbs = [
    { label: t.pageTitle, href: "/accounting/payments" },
    { label: title, current: true },
  ];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={title} subtitle={t.pageSubtitle} breadcrumbs={breadcrumbs} />

      {isEditing ? (
        /* ── EDIT: only hours / gateway / note stay mutable (invoice snapshot locked) ── */
        <Box component="form" onSubmit={handleEditSubmit(onEditSubmit)} noValidate sx={{ maxWidth: 680 }}>
          <Stack spacing={3}>
            <DesktopSectionPanel title={t.paymentDetails}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
                  <TextField
                    size="small"
                    label={t.form.student}
                    value={existing?.studentName ?? "—"}
                    disabled
                    sx={{ flex: 1, minWidth: 220 }}
                  />
                  <TextField
                    size="small"
                    label={`${t.columns.paid} / ${t.form.currency}`}
                    value={existing ? `${formatAccountingMoney(existing.amount)} ${existing.currency ?? ""}` : "—"}
                    disabled
                    sx={{ flex: 1, minWidth: 170 }}
                  />
                </Stack>

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
                      sx={{ maxWidth: 220 }}
                    />
                  )}
                />

                <Controller
                  name="paymentGateway"
                  control={editControl}
                  render={({ field }) => (
                    <FormControl size="small" sx={{ minWidth: 240 }}>
                      <InputLabel>{t.form.paymentGateway}</InputLabel>
                      <Select<PaymentGateway>
                        value={field.value}
                        label={t.form.paymentGateway}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        {GATEWAY_OPTIONS.map(gw => (
                          <MenuItem key={gw} value={gw}>
                            {t.gateways[gw]}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="paymentNote"
                  control={editControl}
                  render={({ field }) => (
                    <TextField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      size="small"
                      multiline
                      minRows={3}
                      label={t.form.note}
                      placeholder={t.form.notePlaceholder}
                    />
                  )}
                />
              </Stack>
            </DesktopSectionPanel>

            <FormActions
              isSubmitting={isSubmitting}
              submitLabel={t.form.submit}
              savingLabel={t.form.saving}
              cancelLabel={t.form.cancel}
            />
          </Stack>
        </Box>
      ) : (
        /* ── CREATE: full form with package auto-fill (hours/amount/currency stay editable) ── */
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 780 }}>
          <Stack spacing={3}>
            <DesktopSectionPanel title={t.form.student}>
              <Controller
                name="studentId"
                control={control}
                render={({ field }) => (
                  <StudentAutocompleteDesktop
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
            </DesktopSectionPanel>

            <DesktopSectionPanel title={t.form.packagePlan}>
              <Stack spacing={3}>
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
                      minWidth={340}
                    />
                  )}
                />
                {errors.packagePlanId ? <FormHelperText error>{errors.packagePlanId.message}</FormHelperText> : null}

                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
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
                        sx={{ flex: 1, minWidth: 150 }}
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
                        sx={{ flex: 1, minWidth: 150 }}
                      />
                    )}
                  />
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>{t.form.currency}</InputLabel>
                        <Select<CurrencyCode>
                          value={field.value}
                          label={t.form.currency}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          {CURRENCY_OPTIONS.map(code => (
                            <MenuItem key={code} value={code}>
                              {CURRENCY_LABELS[code] ?? code}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Stack>
              </Stack>
            </DesktopSectionPanel>

            <DesktopSectionPanel title={t.paymentDetails}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2, alignItems: "center" }}>
                  <Controller
                    name="paymentGateway"
                    control={control}
                    render={({ field }) => (
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>{t.form.paymentGateway}</InputLabel>
                        <Select<PaymentGateway>
                          value={field.value}
                          label={t.form.paymentGateway}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          {GATEWAY_OPTIONS.map(gw => (
                            <MenuItem key={gw} value={gw}>
                              {t.gateways[gw]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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

                  <Controller
                    name="isPaidStatusOn"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                        label={field.value ? t.form.paidToggleOn : t.form.paidToggleOff}
                      />
                    )}
                  />
                </Stack>

                <Controller
                  name="paymentNote"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      size="small"
                      multiline
                      minRows={3}
                      label={t.form.note}
                      placeholder={t.form.notePlaceholder}
                    />
                  )}
                />
              </Stack>
            </DesktopSectionPanel>

            <FormActions
              isSubmitting={isSubmitting}
              submitLabel={t.form.submit}
              savingLabel={t.form.saving}
              cancelLabel={t.form.cancel}
            />
          </Stack>
        </Box>
      )}

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
      <DesktopFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
    </DesktopPageContainer>
  );
}
