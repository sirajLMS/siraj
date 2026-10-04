"use client";

import { useEffect } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useClassSubjects } from "@/frontend/common/views/dashboard/classes/recurring/useClassSubjects";
import { TeacherDashboardDataIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherDashboardDataIsland";
import { TeacherDashboardSnackbarIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherDashboardSnackbarIsland";
import { TeacherHandbookIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherHandbookIsland";
import { TeacherManualEntryIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherManualEntryIsland";
import { TeacherScheduleActionsIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherScheduleActionsIsland";
import { TeacherSupportIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherSupportIsland";
import { buildTeacherDashboardViewModelProps } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer.helpers";
import { useTeacherDashboardSessionPermissions } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer.hooks";
import { TeacherDashboardView } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardView";
import { useTeacherDashboardTranslations } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { useRouter } from "@/shared/i18n/navigation";

/**
 * Thin coordinator over per-feature islands. Each island owns its own Apollo
 * queries/mutations and registers handlers + data on the shared Zustand
 * store; this coordinator just initializes store state, composes the
 * ViewModel prop bag, and delegates tier rendering to `TeacherDashboardView`.
 * The islands stay mounted across the mobile/desktop tier boundary so
 * registrations persist.
 */
export function TeacherDashboardContainer() {
  const translations = useTeacherDashboardTranslations();
  const router = useRouter();
  const userName = useUserStore(state => state.name);
  const { subjects, loading: subjectsLoading } = useClassSubjects();
  const sessionPermissions = useTeacherDashboardSessionPermissions();
  const store = useTeacherDashboardStore();

  const ensureFilterDate = useTeacherDashboardStore(state => state.ensureFilterDate);
  useEffect(() => {
    ensureFilterDate();
  }, [ensureFilterDate]);

  const props = buildTeacherDashboardViewModelProps({
    userName,
    translations,
    router,
    subjects,
    subjectsLoading,
    ...sessionPermissions,
    store,
  });

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      <TeacherDashboardDataIsland labels={translations.labels} lastUpdatedLabels={translations.lastUpdatedLabels} />
      <TeacherScheduleActionsIsland />
      <TeacherManualEntryIsland labels={translations.labels} />
      <TeacherHandbookIsland labels={translations.labels} />
      <TeacherSupportIsland labels={translations.labels} />
      <TeacherDashboardView {...props} />
      <TeacherDashboardSnackbarIsland />
    </RequirePermission>
  );
}
