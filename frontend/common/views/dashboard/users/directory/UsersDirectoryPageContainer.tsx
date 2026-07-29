"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { useUsersDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel";
import { UsersDirectoryView } from "@/frontend/common/views/dashboard/users/directory/UsersDirectoryView";

export function UsersDirectoryPageContainer() {
  const viewModel = useUsersDirectoryTabsViewModel();
  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.usersDirectoryParent} fallback={null}>
      <UsersDirectoryView {...viewModel} />
    </RequirePermission>
  );
}
