"use client";

import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { ManualInvoiceFeeFieldShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceFeeFieldShared";
import { DESKTOP_FEE_FIELD_OPTIONS } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceFeeFieldShared.options";
import type { BaseManualInvoiceFeeFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFeeField.types";

export function ManualInvoiceFeeFieldDesktop(
  props: Readonly<BaseManualInvoiceFeeFieldProps & { draftCurrency?: CurrencyCode }>
) {
  return <ManualInvoiceFeeFieldShared {...props} options={DESKTOP_FEE_FIELD_OPTIONS} />;
}
