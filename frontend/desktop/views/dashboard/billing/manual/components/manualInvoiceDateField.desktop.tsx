"use client";

import {
  ManualInvoiceDateFieldShared,
  type ManualInvoiceDatePickerSlotProps,
} from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceDateFieldShared";
import type { BaseManualInvoiceDateFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceDateField.types";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDatePicker";

function DesktopInvoiceDatePickerSlot({
  error,
  helperText,
  fullWidth,
  ...pickerProps
}: Readonly<ManualInvoiceDatePickerSlotProps>) {
  return (
    <DesktopAppDatePicker
      {...pickerProps}
      slotProps={{
        textField: {
          fullWidth,
          error,
          helperText,
          slotProps: { htmlInput: { autoComplete: "off" } },
        },
      }}
    />
  );
}

export function ManualInvoiceDateFieldDesktop(props: Readonly<BaseManualInvoiceDateFieldProps>) {
  return <ManualInvoiceDateFieldShared {...props} datePickerSlot={{ component: DesktopInvoiceDatePickerSlot }} />;
}
