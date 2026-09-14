"use client";

import { ManualInvoiceDateFieldShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceDateFieldShared";
import type { BaseManualInvoiceDateFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceDateField.types";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date/MobileAppDatePicker";

export function ManualInvoiceDateFieldMobile(props: Readonly<BaseManualInvoiceDateFieldProps>) {
  return <ManualInvoiceDateFieldShared {...props} datePickerSlot={{ component: MobileAppDatePicker }} />;
}
