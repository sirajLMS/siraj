"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { PeopleDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/people/tabs/usePeopleDirectoryTabsViewModel";

const lazyChrome = createLazyView<PeopleDirectoryTabsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/people/peopleDirectory.mobile").then(m => ({
      default: m.PeopleDirectoryMobileChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/people/peopleDirectory.desktop").then(m => ({
      default: m.PeopleDirectoryDesktopChrome,
    }))
);

export function PeopleDirectoryPageChrome(viewModel: Readonly<PeopleDirectoryTabsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
