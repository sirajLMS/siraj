"use client";

import {
  LessonReportSubmitDialog,
  type LessonReportSubmitDialogProps,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog";

/** Mobile host for the lesson report dialog — fills the small viewport edge-to-edge. */
export function LessonReportSubmitDialogMobile(props: Readonly<LessonReportSubmitDialogProps>) {
  return <LessonReportSubmitDialog {...props} fullScreen />;
}
