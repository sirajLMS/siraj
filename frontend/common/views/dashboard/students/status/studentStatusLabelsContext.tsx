"use client";

import type { ReactNode } from "react";
import { StudentStatusLabelsContext } from "@/frontend/common/views/dashboard/students/status/studentStatusLabels.context";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";

export function StudentStatusLabelsProvider({
  labels,
  children,
}: {
  readonly labels: StudentStatusLabels;
  readonly children: ReactNode;
}) {
  return <StudentStatusLabelsContext.Provider value={labels}>{children}</StudentStatusLabelsContext.Provider>;
}
