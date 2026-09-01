"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type DstMigrationViewModel,
  useDstMigrationViewModel,
} from "@/frontend/common/views/dashboard/tools/dst-migration/useDstMigrationViewModel";

const lazyViews = createLazyView<DstMigrationViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/tools/dst-migration/dstMigrationView.mobile").then(m => ({
      default: m.DstMigrationViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/tools/dst-migration/dstMigrationView.desktop").then(m => ({
      default: m.DstMigrationViewDesktop,
    }))
);

export function DstMigrationContainer() {
  const viewModel = useDstMigrationViewModel();

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
