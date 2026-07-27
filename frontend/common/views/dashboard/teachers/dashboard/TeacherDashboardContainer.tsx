"use client";

import { useEffect, useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { TeacherDashboardDataIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherDashboardDataIsland";
import { TeacherDashboardSnackbarIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherDashboardSnackbarIsland";
import { TeacherHandbookIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherHandbookIsland";
import { TeacherManualEntryIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherManualEntryIsland";
import { TeacherScheduleActionsIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherScheduleActionsIsland";
import { TeacherSupportIsland } from "@/frontend/common/views/dashboard/teachers/dashboard/components/TeacherSupportIsland";
import { TeacherDashboardView } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardView";
import type { UseTeacherDashboardViewModelProps } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { buildLessonReportLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildLessonReportLabels";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { useRouter } from "@/shared/i18n/navigation";
import { useAppTranslation } from "@/shared/locale";

const noop = (): void => {};
const noopManualEntrySubmit: UseTeacherDashboardViewModelProps["onManualEntrySubmit"] = async () => {};
const noopLessonReportSubmit: UseTeacherDashboardViewModelProps["onLessonReportSubmit"] = async () => {};

/**
 * Thin coordinator over per-feature islands. Each island owns its own Apollo
 * queries/mutations and registers handlers + data on the shared Zustand
 * store; this coordinator just initializes store state, composes the
 * ViewModel prop bag, and delegates tier rendering to `TeacherDashboardView`.
 * The islands stay mounted across the mobile/desktop tier boundary so
 * registrations persist.
 */
export function TeacherDashboardContainer() {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const dashboardT = useAppTranslation().dashboardTranslations.admin;
  const tJoin = useAppTranslation().uiTranslations.meetingConfigJoin;
  const lessonReportI18n = useAppTranslation().dashboardTranslations.lmsLessonReports;
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const userName = useUserStore(state => state.name);

  const labels = useMemo(
    () => buildTeacherDashboardLabels(t, dashboardT, tJoin.emptyTeacher),
    [t, dashboardT, tJoin.emptyTeacher]
  );
  const lessonReportLabels = useMemo(() => buildLessonReportLabels(lessonReportI18n), [lessonReportI18n]);

  const hasSessionUpdateStatusStart = permissions.includes(AppPermission.SessionUpdateStatusStart);
  const hasSessionUpdateStatusAbsent = permissions.includes(AppPermission.SessionUpdateStatusAbsent);
  const hasSessionUpdateStatusLeave = permissions.includes(AppPermission.SessionUpdateStatusLeave);
  const hasSessionActivateClass = permissions.includes(AppPermission.SessionActivateClass);

  const setSessionPermissionBooleans = useTeacherDashboardStore(state => state.setSessionPermissionBooleans);
  useEffect(() => {
    setSessionPermissionBooleans({
      hasSessionUpdateStatusStart,
      hasSessionUpdateStatusAbsent,
      hasSessionUpdateStatusLeave,
      hasSessionActivateClass,
    });
  }, [
    hasSessionUpdateStatusStart,
    hasSessionUpdateStatusAbsent,
    hasSessionUpdateStatusLeave,
    hasSessionActivateClass,
    setSessionPermissionBooleans,
  ]);

  const {
    filterDate,
    setFilterDate,
    page,
    pageSize,
    setPage,
    absentDialogOpen,
    setAbsentDialogOpen,
    openAbsentDialogForClass,
    absentDialogClassInstanceId,
    manualEntryOpen,
    manualEntryDefaultActive,
    handlers,
    data,
  } = useTeacherDashboardStore();

  const props: UseTeacherDashboardViewModelProps = {
    userName,
    metricItems: data.metricItems,
    scheduleRows: data.scheduleRows,
    progressFeed: data.progressFeed,
    missedAlert: data.missedAlert,
    welcomeDateSummary: filterDate,
    activeSessionsCount: Number(data.metricItems.find(m => m.key === "activeSessions")?.count ?? 0),
    labels,
    lastUpdated: data.lastUpdated,
    activationError: data.activationError,
    canActivate: hasSessionActivateClass,
    canManualEntry: hasSessionActivateClass,
    canPrintSchedule: true,
    loading: data.loading,
    onPrintSchedule: () => globalThis.print(),
    onManualEntry: handlers.onManualEntryOpen ?? noop,
    onNewSession: handlers.onNewSession ?? noop,
    manualEntryOpen,
    manualEntryDefaultActive,
    teacherId: data.teacherId,
    onManualEntryClose: handlers.onManualEntryClose ?? noop,
    onManualEntrySubmit: handlers.onManualEntrySubmit ?? noopManualEntrySubmit,
    onActivate: handlers.onActivate,
    onStartSession: handlers.onStartSession,
    onMarkAbsent: handlers.onMarkAbsent,
    onRequestLeave: handlers.onRequestLeave,
    onViewAll: () => router.push("/schedule"),
    onDownloadHandbook: handlers.onDownloadHandbook ?? noop,
    onContactCoordinator: handlers.onContactCoordinator ?? noop,
    onSupport: handlers.onSupport ?? noop,
    dateValue: filterDate,
    onDateChange: setFilterDate,
    page,
    pageSize,
    totalCount: data.totalCount,
    onPageChange: setPage,
    lessonReportDialogOpen: false,
    lessonReportSelectedClassInstanceId: null,
    lessonReportLabels,
    onLessonReportDialogClose: noop,
    onLessonReportSubmit: noopLessonReportSubmit,
    hasSessionUpdateStatusStart,
    hasSessionUpdateStatusAbsent,
    hasSessionUpdateStatusLeave,
    hasSessionActivateClass,
    absentDialogOpen,
    onAbsentDialogOpen: () => openAbsentDialogForClass(absentDialogClassInstanceId ?? ""),
    onAbsentDialogOpenForClass: (id: string) => openAbsentDialogForClass(id),
    onAbsentDialogClose: () => setAbsentDialogOpen(false),
    onAbsentDialogConfirm: handlers.onAbsentDialogConfirm ?? noop,
  };

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      <TeacherDashboardDataIsland labels={labels} />
      <TeacherScheduleActionsIsland />
      <TeacherManualEntryIsland />
      <TeacherHandbookIsland />
      <TeacherSupportIsland />
      <TeacherDashboardView {...props} />
      <TeacherDashboardSnackbarIsland />
    </RequirePermission>
  );
}
