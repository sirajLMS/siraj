"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherRulesView } from "@/frontend/common/views/dashboard/teachers/rules/TeacherRulesView";

export function TeacherRulesContainer() {
  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      <TeacherRulesView />
    </RequirePermission>
  );
}
