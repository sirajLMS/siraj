"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { CurrencyCode, PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import { PackagePlanSelectShared } from "@/frontend/common/views/dashboard/accounting/components/PackagePlanSelectShared";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

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
    onSubmit,
    onEditSubmit,
    onDismissSuccess,
  } = props;
  const router = useRouter();

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
      <MobilePageHeader title={title} subtitle={t.pageSubtitle} />

      {isEditing ? (
        <Box component="form" onSubmit={handleEditSubmit(onEditSubmit)} noValidate>
          <Stack spacing={2.5} sx={{ px: 2, pb: 6 }}>
            <TextField size="small" label={t.form.student} value={existing?.studentName ?? "—"} disabled />
            <TextField
              size="small"
              label={`${t.columns.paid} / ${t.form.currency}`}
              value={existing ? `${Number(existing.amount ?? 0).toFixed(2)} ${existing.currency ?? ""}` : "—"}
              disabled
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
              name="paymentGateway"
              control={editControl}
              render={({ field }) => (
                <FormControl size="small">
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <SyncOutlined /> : <SaveOutlined />}
            >
              {isSubmitting ? t.form.saving : t.form.submit}
            </Button>
            <Button variant="text" onClick={() => router.push("/accounting/payments")} disabled={isSubmitting}>
              {t.form.cancel}
            </Button>
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

            <Stack direction="row" spacing={1.5}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <FormControl size="small" sx={{ flex: 1 }}>
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
              <Controller
                name="paymentGateway"
                control={control}
                render={({ field }) => (
                  <FormControl size="small" sx={{ flex: 1.4 }}>
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
            </Stack>

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
                  control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label={field.value ? t.form.paidToggleOn : t.form.paidToggleOff}
                />
              )}
            />

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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <SyncOutlined /> : <SaveOutlined />}
            >
              {isSubmitting ? t.form.saving : t.form.submit}
            </Button>
            <Button variant="text" onClick={() => router.push("/accounting/payments")} disabled={isSubmitting}>
              {t.form.cancel}
            </Button>
          </Stack>
        </Box>
      )}

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}
