"use client";

import type { ReactNode } from "react";
import { StudentHistoryLabelsContext } from "@/frontend/common/views/dashboard/students/history/studentHistoryLabels.context";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history";

export function StudentHistoryLabelsProvider({
  labels,
  children,
}: {
  readonly labels: StudentHistoryLabels;
  readonly children: ReactNode;
}) {
  return <StudentHistoryLabelsContext.Provider value={labels}>{children}</StudentHistoryLabelsContext.Provider>;
}
