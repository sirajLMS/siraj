"use client";

import { Autocomplete, Box, Skeleton, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { ManualInvoiceDateFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceDateField.mobile";
import { ManualInvoiceFeeFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceFeeField.mobile";
import { MobileFieldCard } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceFormLayout.mobile";
import { ManualInvoiceParentFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceParentField.mobile";
import type { BillingManualLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

interface ManualInvoiceFormFieldsMobileProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly draftCurrency: CurrencyCode;
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

export function ManualInvoiceFormFieldsMobile({
  control,
  errors,
  labels,
  parentOptions,
  studentOptions,
  draftCurrency,
  parentsLoading = false,
  studentsLoading = false,
}: Readonly<ManualInvoiceFormFieldsMobileProps>) {
  const tProfile = useAppTranslation().profileTranslations.parent;
  const currencyLabel = tProfile.fields.currency;

  const parentField = (
    <ManualInvoiceParentFieldMobile control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileFieldCard label={labels.parentSelection}>{parentFieldNode}</MobileFieldCard>
      <MobileFieldCard label={labels.studentSelection}>{studentFieldNode}</MobileFieldCard>
      <MobileFieldCard label={labels.feeAmount}>
        <ManualInvoiceFeeFieldMobile control={control} errors={errors} labels={labels} draftCurrency={draftCurrency} />
      </MobileFieldCard>
      <MobileFieldCard label={currencyLabel}>
        <CurrencyField control={control} label={currencyLabel} />
      </MobileFieldCard>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <MobileFieldCard label={labels.issueDate}>
          <ManualInvoiceDateFieldMobile control={control} errors={errors} name="issueDate" />
        </MobileFieldCard>
        <MobileFieldCard label={labels.dueDate}>
          <ManualInvoiceDateFieldMobile control={control} errors={errors} name="dueDate" />
        </MobileFieldCard>
      </Box>
    </Box>
  );
}
