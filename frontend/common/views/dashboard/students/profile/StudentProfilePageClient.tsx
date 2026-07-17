"use client";

import { useParams } from "next/navigation";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
    <RequirePermission permissions={[AppPermission.StudentsList, AppPermission.StudentViewAssociated]} fallback={null}>
      <StudentProfileProvider value={viewModel.contextValue}>
        <StudentProfilePageView {...viewModel} />
      </StudentProfileProvider>
    </RequirePermission>
  );
}
