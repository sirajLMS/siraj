"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { PeopleDirectoryView } from "@/frontend/common/views/dashboard/people/PeopleDirectoryView";
import { usePeopleDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/people/tabs/usePeopleDirectoryTabsViewModel";

export function PeopleDirectoryPageContainer() {
  const viewModel = usePeopleDirectoryTabsViewModel();
  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.peopleDirectoryParent} fallback={null}>
      <PeopleDirectoryView {...viewModel} />
    </RequirePermission>
  );
}
