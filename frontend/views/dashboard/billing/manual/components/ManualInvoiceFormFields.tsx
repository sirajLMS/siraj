"use client";

import { Autocomplete, Box, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";
import type { ManualInvoiceFormData } from "../schemas/manualInvoiceSchema";
import type { ParentInvoiceOption, StudentOption } from "../types/manualInvoiceViewTypes";
import { ManualInvoiceDateField } from "./ManualInvoiceDateField";
import { ManualInvoiceFeeField } from "./ManualInvoiceFeeField";
import { FieldLabel, MobileFieldCard } from "./ManualInvoiceFormLayout";
import { ManualInvoiceParentField } from "./ManualInvoiceParentField";

interface ManualInvoiceFormFieldsProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly variant: "desktop" | "mobile";
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
  variant,
}: Readonly<ManualInvoiceFormFieldsProps>) {
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <MobileFieldCard label={labels.parentSelection}>
          <ManualInvoiceParentField control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
        </MobileFieldCard>
        <MobileFieldCard label={labels.studentSelection}>
          <StudentSelectorField control={control} studentOptions={studentOptions} labels={labels} />
        </MobileFieldCard>
        <MobileFieldCard label={labels.feeAmount}>
          <ManualInvoiceFeeField control={control} errors={errors} labels={labels} variant={variant} />
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
        <ManualInvoiceParentField control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.studentSelection}</FieldLabel>
        <StudentSelectorField control={control} studentOptions={studentOptions} labels={labels} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.feeAmount}</FieldLabel>
        <ManualInvoiceFeeField control={control} errors={errors} labels={labels} variant={variant} />
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
