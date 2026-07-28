"use client";

import { useContext } from "react";
import { StudentHistoryLabelsContext } from "@/frontend/common/views/dashboard/students/history/studentHistoryLabels.context";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history";

export function useStudentHistoryLabels(): StudentHistoryLabels {
  const labels = useContext(StudentHistoryLabelsContext);
  if (labels == null) {
    throw new Error("useStudentHistoryLabels must be used within StudentHistoryLabelsProvider");
  }
  return labels;
}
