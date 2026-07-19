"use client";

import { Box } from "@mui/material";
import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BaseManualInvoiceFormFieldsProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFormFields.types";
import { ManualInvoiceDateFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceDateField.desktop";
import { ManualInvoiceFeeFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceFeeField.desktop";
import { ManualInvoiceParentFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceParentField.desktop";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import type { BillingManualLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

function CurrencyField({
  control,
  label,
}: {
  readonly control: Control<ManualInvoiceFormData>;
  readonly label: string;
}) {
  return (
    <Controller
      name="currency"
      control={control}
      render={({ field, fieldState }) => {
        const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
        return (
          <CurrencySelect
            currency={option}
            setCurrencyAction={selected => {
              field.onChange(selected.code);
            }}
            onBlurAction={field.onBlur}
            label={label}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            fullWidth
          />
        );
      }}
    />
  );
}

function StudentSelectorField({
  control,
  selectedParentId,
  labels,
}: {
  readonly control: Control<ManualInvoiceFormData>;
  readonly selectedParentId: string | null;
  readonly labels: BillingManualLabels;
}) {
  return (
    <Controller
      control={control}
      name="studentId"
      render={({ field, fieldState }) => (
        <StudentAutocompleteDesktop
          value={field.value ? ({ id: field.value, name: "" } satisfies PersonOption) : null}
          onChange={option => {
            field.onChange(option?.id ?? "");
          }}
          scope={{ parentId: selectedParentId ?? undefined }}
          skip={!selectedParentId}
          label={labels.studentSelection}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          disabled={!selectedParentId}
        />
      )}
    />
  );
}

export function ManualInvoiceFormFieldsDesktop({
  control,
  errors,
  labels,
  selectedParentId,
}: Readonly<BaseManualInvoiceFormFieldsProps>) {
  const tProfile = useAppTranslation().profileTranslations.parent;
  const currencyLabel = tProfile.fields.currency;
  const watchedParentId = useWatch({ control, name: "parentId" });
  const parentIdForStudents = watchedParentId || selectedParentId;

  const parentField = (
    <ManualInvoiceParentFieldDesktop control={control} errors={errors} labels={labels} />
  );
  const studentField = (
    <StudentSelectorField control={control} selectedParentId={parentIdForStudents} labels={labels} />
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
      }}
    >
      {parentField}
      {studentField}
      <ManualInvoiceFeeFieldDesktop control={control} errors={errors} labels={labels} />
      <CurrencyField control={control} label={currencyLabel} />
      <ManualInvoiceDateFieldDesktop control={control} errors={errors} labels={labels} name="issueDate" />
      <ManualInvoiceDateFieldDesktop control={control} errors={errors} labels={labels} name="dueDate" />
    </Box>
  );
}
