"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentQuotaViewModel,
  type UseStudentQuotaViewModelProps,
  useStudentQuotaViewModel,
} from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";

export type { StudentQuotaViewModel };

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
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
