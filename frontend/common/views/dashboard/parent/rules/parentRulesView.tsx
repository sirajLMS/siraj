"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentRulesViewModel,
  type UseParentRulesViewModelProps,
  useParentRulesViewModel,
} from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";

export type { ParentRulesViewModel };

const lazyViews = createLazyView<ParentRulesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/parent/rules/parentRules.mobile").then(m => ({
      default: m.ParentRulesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parent/rules/parentRules.desktop").then(m => ({
      default: m.ParentRulesDesktopView,
    }))
);

export function ParentRulesView(props: Readonly<UseParentRulesViewModelProps>) {
  const viewModel = useParentRulesViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
