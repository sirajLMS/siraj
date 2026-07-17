"use client";

import { format, isValid } from "date-fns";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date/AppDatePicker";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import { parseFormDate } from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";

const DATE_FORMAT = "yyyy-MM-dd";

interface ManualInvoiceDateFieldMobileProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly name: "issueDate" | "dueDate";
}

export function ManualInvoiceDateFieldMobile({ control, errors, name }: Readonly<ManualInvoiceDateFieldMobileProps>) {
  const fieldError = errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AppDatePicker
          label={undefined}
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
