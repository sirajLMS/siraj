import { outlinedInputSx } from "@/frontend/common/components/ui/form/field/formFieldStyles";
import type { ManualInvoiceFeeFieldSharedOptions } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceFeeFieldShared";

export const DESKTOP_FEE_FIELD_OPTIONS: ManualInvoiceFeeFieldSharedOptions = { textFieldSx: outlinedInputSx };

export const MOBILE_FEE_FIELD_OPTIONS: ManualInvoiceFeeFieldSharedOptions = {
  textFieldSx: theme => ({
    borderRadius: 3,
    "& input": { fontSize: theme.typography.headlineLg.fontSize, fontWeight: 700 },
  }),
};
