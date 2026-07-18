"use client";

import { Controller } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date/AppDatePicker";
import type { BaseManualInvoiceDateFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceDateField.types";
import {
  formatFormDate,
  parseFormDate,
} from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";

export function ManualInvoiceDateFieldMobile({ control, errors, name }: Readonly<BaseManualInvoiceDateFieldProps>) {
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
