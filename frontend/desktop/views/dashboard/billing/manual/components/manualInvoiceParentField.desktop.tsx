"use client";

import { ManualInvoiceParentFieldShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceParentFieldShared";
import type { ManualInvoiceParentFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceParentField.types";
import { ParentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

export function ManualInvoiceParentFieldDesktop(props: Readonly<ManualInvoiceParentFieldProps>) {
  return <ManualInvoiceParentFieldShared {...props} config={{ ParentAutocomplete: ParentAutocompleteDesktop }} />;
}
