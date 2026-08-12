"use client";

import { ManualInvoiceFormFieldsShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceFormFieldsShared";
import type { ManualInvoiceFormFieldsMobileProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFormFields.types";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { ManualInvoiceDateFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceDateField.mobile";
import { ManualInvoiceFeeFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceFeeField.mobile";
import { MobileFieldCard } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceFormLayout.mobile";
import { ManualInvoiceParentFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceParentField.mobile";

export function ManualInvoiceFormFieldsMobile(props: Readonly<ManualInvoiceFormFieldsMobileProps>) {
  const draftCurrency = props.draftCurrency;
  return (
    <ManualInvoiceFormFieldsShared
      {...props}
      config={{
        StudentAutocomplete: StudentAutocompleteMobile,
        ParentField: ManualInvoiceParentFieldMobile,
        FeeField: ManualInvoiceFeeFieldMobile,
        DateField: ManualInvoiceDateFieldMobile,
        FieldWrapper: MobileFieldCard,
        containerSx: { display: "flex", flexDirection: "column", gap: 2 },
        datesGridSx: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 },
        draftCurrency,
      }}
    />
  );
}
