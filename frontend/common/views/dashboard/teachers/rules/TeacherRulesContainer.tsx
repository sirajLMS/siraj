"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type TeacherRulesViewModel,
  type UseTeacherRulesViewModelProps,
  useTeacherRulesViewModel,
} from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";

const lazyViews = createLazyView<TeacherRulesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/rules/teacherRulesView.mobile").then(m => ({
      default: m.TeacherRulesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/rules/teacherRulesView.desktop").then(m => ({
      default: m.TeacherRulesDesktopView,
    }))
);

export function TeacherRulesContainer(props: Readonly<UseTeacherRulesViewModelProps> = {}) {
  const viewModel = useTeacherRulesViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { TeacherRulesViewModel, UseTeacherRulesViewModelProps };
