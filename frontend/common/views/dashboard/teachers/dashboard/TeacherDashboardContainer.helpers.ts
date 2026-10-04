import type { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import type { useClassSubjects } from "@/frontend/common/views/dashboard/classes/recurring/useClassSubjects";
import type { TeacherDashboardSessionPermissions } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer.hooks";
import type {
  TeacherDashboardTranslations,
  UseTeacherDashboardViewModelProps,
} from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import type { useRouter } from "@/shared/i18n/navigation";

type TeacherDashboardStoreState = ReturnType<typeof useTeacherDashboardStore.getState>;

const noop = (): void => {};
const noopManualEntrySubmit: UseTeacherDashboardViewModelProps["onManualEntrySubmit"] = async () => {};
const noopLessonReportSubmit: UseTeacherDashboardViewModelProps["onLessonReportSubmit"] = async () => {};

interface BuildTeacherDashboardViewModelPropsArgs extends TeacherDashboardSessionPermissions {
  readonly userName: string;
  readonly translations: TeacherDashboardTranslations;
  readonly router: ReturnType<typeof useRouter>;
  readonly subjects: ReturnType<typeof useClassSubjects>["subjects"];
  readonly subjectsLoading: boolean;
  readonly store: TeacherDashboardStoreState;
}

/**
 * Composes the ViewModel prop bag handed to `TeacherDashboardView` from the
 * shared store snapshot, the session permission booleans, and the loaded
 * translation labels. Handlers fall back to no-ops until their feature
 * island registers the real implementation on the store.
 */
export function buildTeacherDashboardViewModelProps({
  userName,
  hasSessionUpdateStatusStart,
  hasSessionUpdateStatusAbsent,
  hasSessionUpdateStatusLeave,
  hasSessionActivateClass,
  translations,
  router,
  subjects,
  subjectsLoading,
  store,
}: Readonly<BuildTeacherDashboardViewModelPropsArgs>): UseTeacherDashboardViewModelProps {
  const { labels, lessonReportLabels } = translations;
  const { data, handlers } = store;

  return {
    userName,
    metricItems: data.metricItems,
    scheduleRows: data.scheduleRows,
    progressFeed: data.progressFeed,
    missedAlert: data.missedAlert,
    welcomeDateSummary: store.filterDate,
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
    manualEntryOpen: store.manualEntryOpen,
    manualEntryDefaultActive: store.manualEntryDefaultActive,
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
    dateValue: store.filterDate,
    onDateChange: store.setFilterDate,
    page: store.page,
    pageSize: store.pageSize,
    totalCount: data.totalCount,
    onPageChange: store.setPage,
    lessonReportDialogOpen: false,
    lessonReportSelectedClassInstanceId: null,
    lessonReportLabels,
    onLessonReportDialogClose: noop,
    onLessonReportSubmit: noopLessonReportSubmit,
    hasSessionUpdateStatusStart,
    hasSessionUpdateStatusAbsent,
    hasSessionUpdateStatusLeave,
    hasSessionActivateClass,
    absentDialogOpen: store.absentDialogOpen,
    onAbsentDialogOpen: () => store.openAbsentDialogForClass(store.absentDialogClassInstanceId ?? ""),
    onAbsentDialogOpenForClass: (id: string) => store.openAbsentDialogForClass(id),
    onAbsentDialogClose: () => store.setAbsentDialogOpen(false),
    onAbsentDialogConfirm: handlers.onAbsentDialogConfirm ?? noop,
  };
}
