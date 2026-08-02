"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CronViewModel, useCronViewModel } from "@/frontend/common/views/dashboard/cron/useCronViewModel";

const lazyViews = createLazyView<CronViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/cron/cronView.mobile").then(m => ({
      default: m.CronMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/cron/cronView.desktop").then(m => ({
      default: m.CronDesktopView,
    }))
);

export function CronPageContainer() {
  const viewModel = useCronViewModel();
  return (
    <RequirePermission permissions={[AppPermission.CronManage]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { CronViewModel };
