"use client";

import { ManualInvoiceParentFieldShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceParentFieldShared";
import type { ManualInvoiceParentFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceParentField.types";
import { ParentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export function ManualInvoiceParentFieldMobile(props: Readonly<ManualInvoiceParentFieldProps>) {
  return <ManualInvoiceParentFieldShared {...props} config={{ ParentAutocomplete: ParentAutocompleteMobile }} />;
}
