"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentOnboardingView } from "@/frontend/common/views/dashboard/students/onboarding/StudentOnboardingView";

export function StudentOnboardingContainer() {
  return (
    <RequirePermission permissions={[AppPermission.StudentsCreate]}>
      <StudentOnboardingView />
    </RequirePermission>
  );
}
