"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  CreateRecurringClassViewModel,
  UseCreateRecurringClassViewModelProps,
} from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";

const lazyViews = createLazyView<CreateRecurringClassViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/recurring/createRecurringClassView.mobile").then(m => ({
      default: m.CreateRecurringClassViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/recurring/createRecurringClassView.desktop").then(m => ({
      default: m.CreateRecurringClassViewDesktop,
    }))
);

export function CreateRecurringClassView(props: Readonly<CreateRecurringClassViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { CreateRecurringClassViewModel, UseCreateRecurringClassViewModelProps };
