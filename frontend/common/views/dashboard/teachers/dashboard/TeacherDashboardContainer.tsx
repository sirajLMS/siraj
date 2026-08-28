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
import { TeacherDashboardView } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardView";
import {
  type UseTeacherDashboardViewModelProps,
  useTeacherDashboardTranslations,
} from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { useRouter } from "@/shared/i18n/navigation";

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
  const { labels, lessonReportLabels, lastUpdatedLabels } = useTeacherDashboardTranslations();
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const userName = useUserStore(state => state.name);
  const { subjects, loading: subjectsLoading } = useClassSubjects();

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

  const ensureFilterDate = useTeacherDashboardStore(state => state.ensureFilterDate);
  useEffect(() => {
    ensureFilterDate();
  }, [ensureFilterDate]);

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
    subjects,
    subjectsLoading,
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
      <TeacherDashboardDataIsland labels={labels} lastUpdatedLabels={lastUpdatedLabels} />
      <TeacherScheduleActionsIsland />
      <TeacherManualEntryIsland labels={labels} />
      <TeacherHandbookIsland labels={labels} />
      <TeacherSupportIsland labels={labels} />
      <TeacherDashboardView {...props} />
      <TeacherDashboardSnackbarIsland />
    </RequirePermission>
  );
}
