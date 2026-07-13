"use client";

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentsView } from "@/frontend/views/dashboard/admin/parents/students/studentsView";
import { useStudentsViewModel } from "@/frontend/views/dashboard/admin/parents/students/useStudentsViewModel";

export function StudentsContainer() {
  const viewModel = useStudentsViewModel();

  return (
    <RequirePermission permissions={[AppPermission.StudentsList]}>
      <StudentsView {...viewModel} />
    </RequirePermission>
  );
}
