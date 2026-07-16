"use client";

import { format, isValid } from "date-fns";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date/AppDatePicker";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import { parseFormDate } from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";
import type { BillingManualLabels } from "@/shared/locale";

const DATE_FORMAT = "yyyy-MM-dd";

interface ManualInvoiceDateFieldProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly name: "issueDate" | "dueDate";
  readonly variant: "desktop" | "mobile";
}

export function ManualInvoiceDateField({
  control,
  errors,
  labels,
  name,
  variant,
}: Readonly<ManualInvoiceDateFieldProps>) {
  const isMobile = variant === "mobile";
  const label = name === "issueDate" ? labels.issueDate : labels.dueDate;
  const fieldError = errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AppDatePicker
          label={isMobile ? undefined : label}
          value={parseFormDate(field.value)}
          onChange={(date: Date | null) => {
            field.onChange(date && isValid(date) ? format(date, DATE_FORMAT) : "");
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              error: Boolean(fieldError),
              helperText: fieldError?.message,
              slotProps: { htmlInput: { autoComplete: "off" } },
            },
          }}
        />
      )}
    />
  );
}
