"use client";

import { useParams } from "next/navigation";
import { StudentProfilePageView } from "@/frontend/common/views/dashboard/students/profile/StudentProfilePageView";
import { StudentProfileProvider } from "@/frontend/common/views/dashboard/students/profile/StudentProfileProvider";
import { useStudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";

export function StudentProfilePageClient() {
  const params = useParams();
  const studentId = typeof params?.id === "string" ? params.id : "";

  const viewModel = useStudentProfilePageViewModel({ studentId });

  if (!studentId) {
    return null;
  }

  return (
    <StudentProfileProvider value={viewModel.contextValue}>
      <StudentProfilePageView {...viewModel} />
    </StudentProfileProvider>
  );
}
