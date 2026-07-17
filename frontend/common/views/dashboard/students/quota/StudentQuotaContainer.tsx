"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import {
  type StudentQuotaViewModel,
  type UseStudentQuotaViewModelProps,
  useStudentQuotaViewModel,
} from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";

const lazyViews = createLazyView<StudentQuotaViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/quota/studentQuota.mobile").then(m => ({
      default: m.StudentQuotaMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/quota/studentQuota.desktop").then(m => ({
      default: m.StudentQuotaDesktopView,
    }))
);

export function StudentQuotaView(props: Readonly<UseStudentQuotaViewModelProps>) {
  const viewModel = useStudentQuotaViewModel(props);

  if (viewModel.loadingState === "loading") {
    return null; // The mobile/desktop views will handle loading state
  }

  if (viewModel.loadingState === "missing") {
    return <ProfileRestrictedSection title={viewModel.t.breadcrumbs.adjustQuota} />;
  }

  if (viewModel.loadingState === "error") {
    return <div>{viewModel.errorMessage}</div>;
  }

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { StudentQuotaViewModel, UseStudentQuotaViewModelProps };
