"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherRulesViewModel,
  type UseTeacherRulesViewModelProps,
  useTeacherRulesViewModel,
} from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";

export type { TeacherRulesViewModel };

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

/**
 * Switcher for the Teacher Rules view. Lazily loads the matching tier's view
 * (`teacherRulesView.mobile.tsx` / `teacherRulesView.desktop.tsx`) via
 * `ResponsiveViewSwitch`. The ViewModel hook owns the handbook-download
 * orchestration and label building; both tier views consume the flat model.
 */
export function TeacherRulesView(props: Readonly<UseTeacherRulesViewModelProps> = {}) {
  const viewModel = useTeacherRulesViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
