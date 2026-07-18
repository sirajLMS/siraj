"use client";

import { Controller } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date/AppDatePicker";
import type { ManualInvoiceDateFieldDesktopProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceDateField.types";
import {
  formatFormDate,
  parseFormDate,
} from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";

export function ManualInvoiceDateFieldDesktop({
  control,
  errors,
  labels,
  name,
}: Readonly<ManualInvoiceDateFieldDesktopProps>) {
  const label = name === "issueDate" ? labels.issueDate : labels.dueDate;
  const fieldError = errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AppDatePicker
          label={label}
          value={parseFormDate(field.value)}
          onChange={(date: Date | null) => {
            field.onChange(formatFormDate(date));
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
