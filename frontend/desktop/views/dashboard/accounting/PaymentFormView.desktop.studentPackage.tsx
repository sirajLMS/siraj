"use client";

import { Box, FormHelperText, Stack } from "@mui/material";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import {
  PaymentDecimalControllerField,
  PaymentStudentControllerField,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared";
import { PackagePlanAutocomplete } from "@/frontend/common/views/dashboard/accounting/components/PackagePlanAutocomplete";
import { CurrencyMismatchAlert } from "@/frontend/common/views/dashboard/accounting/components/PaymentFormFields";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

type StudentPackageSectionProps = Pick<
  UsePaymentFormViewModel,
  "t" | "control" | "errors" | "currencyMismatch" | "lastPaymentCurrency"
>;

/** Create mode: student picker plus package auto-fill panel (hours/amount/currency stay editable). */
export function PaymentCreateStudentPackageSection({
  t,
  control,
  errors,
  currencyMismatch,
  lastPaymentCurrency,
}: Readonly<StudentPackageSectionProps>) {
  return (
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
  );
}
