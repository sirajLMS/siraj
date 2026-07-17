"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherStudentsView } from "@/frontend/common/views/dashboard/teachers/students/TeacherStudentsView";

export function TeacherStudentsContainer() {
  return (
    <RequirePermission permissions={[AppPermission.TeacherViewStudents]}>
      <TeacherStudentsView />
    </RequirePermission>
  );
}
