"use client";

import { useUsersDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel";
import { UsersDirectoryView } from "@/frontend/common/views/dashboard/users/directory/UsersDirectoryView";

export function UsersDirectoryPageContainer() {
  const viewModel = useUsersDirectoryTabsViewModel();
  return <UsersDirectoryView {...viewModel} />;
}
