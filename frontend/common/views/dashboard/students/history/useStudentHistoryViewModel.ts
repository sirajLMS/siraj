"use client";

import type { StudentHistoryViewProps } from "@/frontend/common/views/dashboard/students/history/types";

export type StudentHistoryViewModel = StudentHistoryViewProps;

export function useStudentHistoryViewModel(props: Readonly<StudentHistoryViewModel>): StudentHistoryViewModel {
  return props;
}
