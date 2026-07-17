"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type SubjectDetailViewModel,
  type UseSubjectDetailViewModelProps,
  useSubjectDetailViewModel,
} from "@/frontend/common/views/dashboard/subjects/detail/useSubjectDetailViewModel";

export type { SubjectDetailViewModel, UseSubjectDetailViewModelProps };

const lazyViews = createLazyView<SubjectDetailViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/subjects/detail/subjectDetail.mobile").then(m => ({
      default: m.SubjectDetailMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/subjects/detail/subjectDetail.desktop").then(m => ({
      default: m.SubjectDetailDesktopView,
    }))
);

export function SubjectDetailView(props: Readonly<UseSubjectDetailViewModelProps>) {
  const viewModel = useSubjectDetailViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
