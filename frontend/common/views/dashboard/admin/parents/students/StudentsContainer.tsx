"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentsView } from "@/frontend/common/views/dashboard/admin/parents/students/studentsView";
import { useStudentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel";

export function StudentsContainer() {
  const viewModel = useStudentsViewModel();

  return (
    <RequirePermission permissions={[AppPermission.StudentsList]}>
      <StudentsView {...viewModel} />
    </RequirePermission>
  );
}
