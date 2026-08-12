"use client";

import {
  RecurringClassFormShared,
  type RecurringClassFormSharedOptions,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared";
import type { BaseRecurringClassFormProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { RecurringClassFormFieldsMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/recurringClassFormFields.mobile";

// VARIANT JUSTIFICATION: Mobile tier does not render the success badge inline
// (snackbar handled by Container-level ViewModel). Desktop variant adds the
// `showSuccess` field for inline badge display (per specs.md §4.1 — Class-C
// variant: structural/visual divergence between tiers is documented here).
// The mobile interface intentionally mirrors the base shape with no additions;
// we keep it as a named type (rather than aliasing `BaseRecurringClassFormProps`
// directly) so future mobile-only rendering additions land here without
// touching call sites.
export type RecurringClassFormMobileProps = BaseRecurringClassFormProps;

const MOBILE_FORM_OPTIONS: RecurringClassFormSharedOptions = {
  scrollableBodyPaddingScale: 2,
  formActionsAlignItems: "stretch",
  submitButtonSx: () => ({ px: 4, py: 1.75, maxWidth: 480, alignSelf: "center", width: "100%" }),
  submitButtonFullWidth: true,
  showSuccessBadgeInline: false,
  fieldsComponent: RecurringClassFormFieldsMobile,
};

export function RecurringClassFormMobile(props: RecurringClassFormMobileProps) {
  return <RecurringClassFormShared {...props} options={MOBILE_FORM_OPTIONS} />;
}
