"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { UseGeneralUserCreateViewModelProps } from "@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel";

const lazyViews = createLazyView<UseGeneralUserCreateViewModelProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile").then(m => ({
      default: m.GeneralUserCreateMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop").then(m => ({
      default: m.GeneralUserCreateDesktop,
    }))
);

export function GeneralUserCreateContainer() {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={{}} />;
}
