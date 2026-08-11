"use client";

import {
  RecurringClassFormShared,
  type RecurringClassFormSharedOptions,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared";
import type { BaseRecurringClassFormProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { RecurringClassFormFieldsDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/recurringClassFormFields.desktop";

// VARIANT JUSTIFICATION: Desktop tier renders an inline success badge after
// submission. Mobile delegates the success UI to the Container-level snackbar
// via the ViewModel (per specs.md §4.1 — Class-C variant).
export interface RecurringClassFormDesktopProps extends BaseRecurringClassFormProps {
  readonly showSuccess: boolean;
}

const DESKTOP_FORM_OPTIONS: RecurringClassFormSharedOptions = {
  scrollableBodyPaddingScale: 3,
  formActionsAlignItems: "flex-end",
  submitButtonSx: () => ({ px: 5, py: 1.5 }),
  submitButtonFullWidth: false,
  showSuccessBadgeInline: true,
  fieldsComponent: RecurringClassFormFieldsDesktop,
};

export function RecurringClassFormDesktop(props: RecurringClassFormDesktopProps) {
  return <RecurringClassFormShared {...props} options={DESKTOP_FORM_OPTIONS} />;
}
