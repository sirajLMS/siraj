"use client";

import { StudentHistoryView } from "@/frontend/common/views/dashboard/students/history/StudentHistoryView";
import {
  type UseStudentHistoryViewModelProps,
  useStudentHistoryViewModel,
} from "@/frontend/common/views/dashboard/students/history/useStudentHistoryViewModel";

export function StudentHistoryContainer(props: Readonly<UseStudentHistoryViewModelProps>) {
  const viewModel = useStudentHistoryViewModel(props);

  return <StudentHistoryView {...viewModel} />;
}
