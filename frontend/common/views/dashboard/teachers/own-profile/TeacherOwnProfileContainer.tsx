"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherOwnProfileView } from "@/frontend/common/views/dashboard/teachers/own-profile/TeacherOwnProfileView";

export function TeacherOwnProfileContainer() {
  return (
    <RequirePermission permissions={[AppPermission.TeacherViewOwnProfile]}>
      <TeacherOwnProfileView />
    </RequirePermission>
  );
}

export default TeacherOwnProfileContainer;
