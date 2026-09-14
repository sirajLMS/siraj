"use client";

import type { ComponentType } from "react";
import { Controller } from "react-hook-form";
import type { BaseManualInvoiceDateFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceDateField.types";
import {
  formatFormDate,
  parseFormDate,
} from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";

// --- Date picker slot ---

export interface ManualInvoiceDatePickerSlotProps {
  readonly label: string;
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly error: boolean;
  readonly helperText?: string;
  readonly disabled?: boolean;
  readonly fullWidth: boolean;
}

interface ManualInvoiceDatePickerSlot {
  readonly component: ComponentType<ManualInvoiceDatePickerSlotProps>;
}

// --- Shared props ---

export interface ManualInvoiceDateFieldSharedProps extends BaseManualInvoiceDateFieldProps {
  readonly datePickerSlot: ManualInvoiceDatePickerSlot;
}

export function ManualInvoiceDateFieldShared({
  control,
  errors,
  labels,
  name,
  datePickerSlot,
}: Readonly<ManualInvoiceDateFieldSharedProps>) {
  const label = name === "issueDate" ? labels.issueDate : labels.dueDate;
  const fieldError = errors[name];
  const DatePickerComponent = datePickerSlot.component;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <DatePickerComponent
          label={label}
          value={parseFormDate(field.value)}
          onChange={(date: Date | null) => {
            field.onChange(formatFormDate(date));
          }}
          error={Boolean(fieldError)}
          helperText={fieldError?.message}
          fullWidth
        />
      )}
    />
  );
}
