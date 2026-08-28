"use client";

import {
  ManualClassEntryDialog,
  type ManualClassEntryDialogProps,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";

/** Desktop host for the manual class entry dialog — centered `sm`-width panel. */
export function ManualClassEntryDialogDesktop(props: Readonly<ManualClassEntryDialogProps>) {
  return <ManualClassEntryDialog {...props} fullScreen={false} />;
}
