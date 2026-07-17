"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ParentRulesViewModel } from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";

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

export function ParentRulesView(props: Readonly<ParentRulesViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { ParentRulesViewModel };
