"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherClassListView } from "@/frontend/common/views/dashboard/teachers/classes/TeacherClassListView";

export function TeacherClassListContainer() {
  return (
    <RequirePermission permissions={[AppPermission.SessionViewDetails]}>
      <TeacherClassListView />
    </RequirePermission>
  );
}
