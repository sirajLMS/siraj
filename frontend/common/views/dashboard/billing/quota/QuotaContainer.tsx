"use client";

import type { ComponentProps } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { QuotaListDesktop } from "@/frontend/common/views/dashboard/billing/quota/components/QuotaListDesktop";
import type { QuotaListMobile } from "@/frontend/common/views/dashboard/billing/quota/components/QuotaListMobile";
import { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";

const lazyViews = createLazyView<ComponentProps<typeof QuotaListDesktop | typeof QuotaListMobile>>(
  () =>
    import("@/frontend/common/views/dashboard/billing/quota/components/QuotaListDesktop").then(m => ({
      default: m.QuotaListDesktop,
    })),
  () =>
    import("@/frontend/common/views/dashboard/billing/quota/components/QuotaListMobile").then(m => ({
      default: m.QuotaListMobile,
    }))
);

export function QuotaContainer() {
  const viewModel = useQuotaViewModel();
  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={viewModel as unknown as ComponentProps<typeof QuotaListDesktop>}
    />
  );
}
