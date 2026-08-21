"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { TeacherOwnProfileView } from "@/frontend/common/views/dashboard/teachers/own-profile/TeacherOwnProfileView";

export function TeacherOwnProfileContainer() {
  return (
    <RequirePermission permissions={[AppPermission.ProfileCoreIdentityViewOwn]}>
      <TeacherOwnProfileView />
    </RequirePermission>
  );
}

export default TeacherOwnProfileContainer;
