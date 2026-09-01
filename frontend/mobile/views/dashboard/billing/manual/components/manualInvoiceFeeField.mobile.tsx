"use client";

import { ManualInvoiceFeeFieldShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceFeeFieldShared";
import { MOBILE_FEE_FIELD_OPTIONS } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceFeeFieldShared.options";
import type { ManualInvoiceFeeFieldMobileProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFeeField.types";

export function ManualInvoiceFeeFieldMobile(props: Readonly<ManualInvoiceFeeFieldMobileProps>) {
  return <ManualInvoiceFeeFieldShared {...props} options={MOBILE_FEE_FIELD_OPTIONS} />;
}
