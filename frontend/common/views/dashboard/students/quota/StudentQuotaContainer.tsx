"use client";

import { Typography } from "@mui/material";
import { LoadingState } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { QuotaAudienceView } from "@/frontend/common/views/dashboard/students/quota/audience";
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

  // Dashboard overview mode (no specific studentId) — render per-audience view
  if (!props.studentId) {
    if (viewModel.loadingState === "loading") {
      return <LoadingState />;
    }
    return <QuotaAudienceView t={viewModel.t} />;
  }

  if (viewModel.loadingState === "loading") {
    return <LoadingState />;
  }

  if (viewModel.loadingState === "missing") {
    return <ProfileRestrictedSection title={viewModel.t.breadcrumbs.adjustQuota} />;
  }

  if (viewModel.loadingState === "error") {
    return <Typography sx={theme => ({ color: theme.palette.error.main, p: 2 })}>{viewModel.errorMessage}</Typography>;
  }

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { UseStudentQuotaViewModelProps };
