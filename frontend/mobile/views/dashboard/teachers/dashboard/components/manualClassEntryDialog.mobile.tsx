"use client";

import {
  ManualClassEntryDialog,
  type ManualClassEntryDialogProps,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";

/** Mobile host for the manual class entry dialog — fills the small viewport edge-to-edge. */
export function ManualClassEntryDialogMobile(props: Readonly<ManualClassEntryDialogProps>) {
  return <ManualClassEntryDialog {...props} fullScreen />;
}
