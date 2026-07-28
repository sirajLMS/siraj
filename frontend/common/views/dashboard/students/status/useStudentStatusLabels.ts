"use client";

import { useContext } from "react";
import { StudentStatusLabelsContext } from "@/frontend/common/views/dashboard/students/status/studentStatusLabels.context";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";

export function useStudentStatusLabels(): StudentStatusLabels {
  const labels = useContext(StudentStatusLabelsContext);
  if (labels == null) {
    throw new Error("useStudentStatusLabels must be used within StudentStatusLabelsProvider");
  }
  return labels;
}
