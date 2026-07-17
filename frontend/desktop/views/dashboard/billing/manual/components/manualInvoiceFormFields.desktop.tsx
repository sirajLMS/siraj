"use client";

import { Autocomplete, Box, Skeleton, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { ManualInvoiceDateFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceDateField.desktop";
import { ManualInvoiceFeeFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceFeeField.desktop";
import { FieldLabelDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceFormLayout.desktop";
import { ManualInvoiceParentFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceParentField.desktop";
import type { BillingManualLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

interface ManualInvoiceFormFieldsDesktopProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly parentsLoading?: boolean;
  readonly studentsLoading?: boolean;
}

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
  studentOptions,
  labels,
}: {
  readonly control: Control<ManualInvoiceFormData>;
  readonly studentOptions: readonly StudentOption[];
  readonly labels: BillingManualLabels;
}) {
  return (
    <Controller
      control={control}
      name="studentId"
      render={({ field }) => (
        <Autocomplete
          options={studentOptions}
          getOptionLabel={option => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={studentOptions.find(s => s.id === field.value) ?? null}
          onChange={(_e, newValue) => {
            field.onChange(newValue?.id ?? "");
          }}
          renderInput={params => (
            <TextField
              {...params}
              slotProps={{
                ...params.slotProps,
                htmlInput: {
                  ...params.slotProps.htmlInput,
                  autoComplete: "off",
                },
              }}
              label={labels.studentSelection}
              size="small"
              fullWidth
            />
          )}
          size="small"
        />
      )}
    />
  );
}

export function ManualInvoiceFormFieldsDesktop({
  control,
  errors,
  labels,
  parentOptions,
  studentOptions,
  parentsLoading = false,
  studentsLoading = false,
}: Readonly<ManualInvoiceFormFieldsDesktopProps>) {
  const tProfile = useAppTranslation().profileTranslations.parent;
  const currencyLabel = tProfile.fields.currency;

  const parentField = (
    <ManualInvoiceParentFieldDesktop control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
  );
  const studentField = <StudentSelectorField control={control} studentOptions={studentOptions} labels={labels} />;

  const parentFieldNode = parentsLoading ? (
    <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
  ) : (
    parentField
  );
  const studentFieldNode = studentsLoading ? (
    <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
  ) : (
    studentField
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabelDesktop>{labels.parentSelection}</FieldLabelDesktop>
        {parentFieldNode}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabelDesktop>{labels.studentSelection}</FieldLabelDesktop>
        {studentFieldNode}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabelDesktop>{labels.feeAmount}</FieldLabelDesktop>
        <ManualInvoiceFeeFieldDesktop control={control} errors={errors} labels={labels} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <CurrencyField control={control} label={currencyLabel} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabelDesktop>{labels.issueDate}</FieldLabelDesktop>
        <ManualInvoiceDateFieldDesktop control={control} errors={errors} labels={labels} name="issueDate" />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabelDesktop>{labels.dueDate}</FieldLabelDesktop>
        <ManualInvoiceDateFieldDesktop control={control} errors={errors} labels={labels} name="dueDate" />
      </Box>
    </Box>
  );
}
