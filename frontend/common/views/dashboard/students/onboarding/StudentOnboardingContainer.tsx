"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type StudentOnboardingViewModel,
  useStudentOnboardingViewModel,
} from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";

const lazyViews = createLazyView<StudentOnboardingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/onboarding/studentOnboarding.mobile").then(m => ({
      default: m.StudentOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/onboarding/studentOnboarding.desktop").then(m => ({
      default: m.StudentOnboardingDesktopView,
    }))
);

export function StudentOnboardingView() {
  const viewModel = useStudentOnboardingViewModel({});

  return (
    <RequirePermission permissions={[AppPermission.StudentsCreate]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}
export type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
