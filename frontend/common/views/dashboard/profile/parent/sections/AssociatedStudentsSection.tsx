"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import {
  type UseAssociatedStudentsSectionViewModelProps,
  useAssociatedStudentsSectionViewModel,
} from "@/frontend/common/views/dashboard/profile/parent/useAssociatedStudentsSectionViewModel";

type AssociatedStudentsSectionProps = UseAssociatedStudentsSectionViewModelProps;

const lazyViews = createLazyView<AssociatedStudentsSectionVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsSection.mobile").then(m => ({
      default: m.AssociatedStudentsSectionMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsSection.desktop").then(m => ({
      default: m.AssociatedStudentsSectionDesktopView,
    }))
);

export function AssociatedStudentsSection(props: Readonly<AssociatedStudentsSectionProps>) {
  const { labels, rows, loading, emptyMessage } = useAssociatedStudentsSectionViewModel(props);

  const variantProps: AssociatedStudentsSectionVariantProps = {
    labels,
    rows,
    loading,
    emptyMessage,
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={variantProps} />;
}
