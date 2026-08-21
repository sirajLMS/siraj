"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ProfileByUserIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import { useAssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/useAssignedStudentsTabViewModel";

type AssignedStudentsResult = NonNullable<ProfileByUserIdQuery["profileByUserId"]>["assignedStudents"];

type AssignedStudentsTabProps = {
  readonly assignedStudents: AssignedStudentsResult | null | undefined;
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly onRetry: () => void;
};

const lazyViews = createLazyView<AssignedStudentsTabViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsTab.mobile").then(m => ({
      default: m.AssignedStudentsTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/teacher/students/assignedStudentsTab.desktop").then(m => ({
      default: m.AssignedStudentsTabDesktopView,
    }))
);

export function AssignedStudentsTab({ assignedStudents, loading, hasError, onRetry }: AssignedStudentsTabProps) {
  const viewModel = useAssignedStudentsTabViewModel({ assignedStudents, loading, hasError, onRetry });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
