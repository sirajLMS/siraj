"use client";

import { Autocomplete, Box, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";
import { ManualInvoiceDateField } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceDateField";
import { ManualInvoiceFeeField } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceFeeField";
import {
  FieldLabel,
  MobileFieldCard,
} from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceFormLayout";
import { ManualInvoiceParentField } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceParentField";
import type { ManualInvoiceFormData } from "@/frontend/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

interface ManualInvoiceFormFieldsProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly draftCurrency: CurrencyCode;
  readonly variant: "desktop" | "mobile";
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
}: Readonly<ManualInvoiceFormFieldsProps>) {
  const isMobile = variant === "mobile";
  const tProfile = useTranslations("profile.parent");
  const currencyLabel = tProfile("fields.currency");

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
        <ManualInvoiceParentField control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.studentSelection}</FieldLabel>
        <StudentSelectorField control={control} studentOptions={studentOptions} labels={labels} />
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
