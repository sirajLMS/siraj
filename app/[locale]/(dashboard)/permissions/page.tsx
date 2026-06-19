import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { PermissionManagementContainer } from "@/frontend/views/dashboard/permissions/PermissionManagementContainer";

export default function PermissionsPage() {
  return (
    <RequirePermission permissions={[AppPermission.PermissionGroupsManage]}>
      <PermissionManagementContainer />
    </RequirePermission>
  );
}
