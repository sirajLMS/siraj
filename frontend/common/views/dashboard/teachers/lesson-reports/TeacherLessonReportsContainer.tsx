"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherLessonReportsView } from "@/frontend/common/views/dashboard/teachers/lesson-reports/TeacherLessonReportsView";
import {
  type TeacherLessonReportsViewModel,
  type UseTeacherLessonReportsViewModelProps,
  useTeacherLessonReportsViewModel,
} from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";

export function TeacherLessonReportsContainer(props: Readonly<UseTeacherLessonReportsViewModelProps>) {
  const viewModel = useTeacherLessonReportsViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]} fallback={null}>
      <TeacherLessonReportsView {...viewModel} />
    </RequirePermission>
  );
}

export type { TeacherLessonReportsViewModel, UseTeacherLessonReportsViewModelProps };
