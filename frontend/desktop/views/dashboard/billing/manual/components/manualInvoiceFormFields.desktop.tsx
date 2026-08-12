"use client";

import { ManualInvoiceFormFieldsShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceFormFieldsShared";
import type { BaseManualInvoiceFormFieldsProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFormFields.types";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { ManualInvoiceDateFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceDateField.desktop";
import { ManualInvoiceFeeFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceFeeField.desktop";
import { ManualInvoiceParentFieldDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceParentField.desktop";

const DESKTOP_CONFIG = {
  StudentAutocomplete: StudentAutocompleteDesktop,
  ParentField: ManualInvoiceParentFieldDesktop,
  FeeField: ManualInvoiceFeeFieldDesktop,
  DateField: ManualInvoiceDateFieldDesktop,
  containerSx: {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
    gap: 3,
  },
  datesGridSx: { display: "contents" },
};

export function ManualInvoiceFormFieldsDesktop(props: Readonly<BaseManualInvoiceFormFieldsProps>) {
  return <ManualInvoiceFormFieldsShared {...props} config={DESKTOP_CONFIG} />;
}
