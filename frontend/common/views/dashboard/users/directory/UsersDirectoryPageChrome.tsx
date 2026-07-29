"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { UsersDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel";

const lazyChrome = createLazyView<UsersDirectoryTabsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/users/directory/usersDirectory.mobile").then(m => ({
      default: m.UsersDirectoryMobileChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/users/directory/usersDirectory.desktop").then(m => ({
      default: m.UsersDirectoryDesktopChrome,
    }))
);

export function UsersDirectoryPageChrome(viewModel: Readonly<UsersDirectoryTabsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
