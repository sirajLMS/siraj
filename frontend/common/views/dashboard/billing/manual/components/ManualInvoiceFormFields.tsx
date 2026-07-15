"use client";

import { Autocomplete, Box, Skeleton, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { ManualInvoiceDateField } from "@/frontend/common/views/dashboard/billing/manual/components/ManualInvoiceDateField";
import { ManualInvoiceFeeField } from "@/frontend/common/views/dashboard/billing/manual/components/ManualInvoiceFeeField";
import {
  FieldLabel,
  MobileFieldCard,
} from "@/frontend/common/views/dashboard/billing/manual/components/ManualInvoiceFormLayout";
import { ManualInvoiceParentField } from "@/frontend/common/views/dashboard/billing/manual/components/ManualInvoiceParentField";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { useAppTranslation } from "@/shared/locale/client";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual";

interface ManualInvoiceFormFieldsProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly draftCurrency: CurrencyCode;
  readonly variant: "desktop" | "mobile";
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

export function ManualInvoiceFormFields({
  control,
  errors,
  labels,
  parentOptions,
  studentOptions,
  draftCurrency,
  variant,
  parentsLoading = false,
  studentsLoading = false,
}: Readonly<ManualInvoiceFormFieldsProps>) {
  const isMobile = variant === "mobile";
  const tProfile = useAppTranslation("profile").parent;
  const currencyLabel = tProfile.fields.currency;

  const parentField = (
    <ManualInvoiceParentField control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
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

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <MobileFieldCard label={labels.parentSelection}>{parentFieldNode}</MobileFieldCard>
        <MobileFieldCard label={labels.studentSelection}>{studentFieldNode}</MobileFieldCard>
        <MobileFieldCard label={labels.feeAmount}>
          <ManualInvoiceFeeField
            control={control}
            errors={errors}
            labels={labels}
            draftCurrency={draftCurrency}
            variant={variant}
          />
        </MobileFieldCard>
        <MobileFieldCard label={currencyLabel}>
          <CurrencyField control={control} label={currencyLabel} />
        </MobileFieldCard>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <MobileFieldCard label={labels.issueDate}>
            <ManualInvoiceDateField
              control={control}
              errors={errors}
              labels={labels}
              name="issueDate"
              variant={variant}
            />
          </MobileFieldCard>
          <MobileFieldCard label={labels.dueDate}>
            <ManualInvoiceDateField
              control={control}
              errors={errors}
              labels={labels}
              name="dueDate"
              variant={variant}
            />
          </MobileFieldCard>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.parentSelection}</FieldLabel>
        {parentFieldNode}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.studentSelection}</FieldLabel>
        {studentFieldNode}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.feeAmount}</FieldLabel>
        <ManualInvoiceFeeField
          control={control}
          errors={errors}
          labels={labels}
          draftCurrency={draftCurrency}
          variant={variant}
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <CurrencyField control={control} label={currencyLabel} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.issueDate}</FieldLabel>
        <ManualInvoiceDateField control={control} errors={errors} labels={labels} name="issueDate" variant={variant} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.dueDate}</FieldLabel>
        <ManualInvoiceDateField control={control} errors={errors} labels={labels} name="dueDate" variant={variant} />
      </Box>
    </Box>
  );
}
