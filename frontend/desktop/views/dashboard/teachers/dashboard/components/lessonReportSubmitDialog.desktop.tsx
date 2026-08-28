"use client";

import {
  LessonReportSubmitDialog,
  type LessonReportSubmitDialogProps,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog";

/** Desktop host for the lesson report dialog — centered `sm`-width panel. */
export function LessonReportSubmitDialogDesktop(props: Readonly<LessonReportSubmitDialogProps>) {
  return <LessonReportSubmitDialog {...props} fullScreen={false} />;
}
