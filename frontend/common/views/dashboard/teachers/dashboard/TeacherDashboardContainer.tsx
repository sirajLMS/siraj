"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission, type ClassType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  activateClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/scheduling/class-session.documents";
import {
  createTeacherManualClassEntryMutationDocument,
  logTeacherSupportRequestMutationDocument,
  teacherDashboardQueryDocument,
  teacherHandbookUrlQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { StudentProgressFeedItem, TeacherProgressFeedEventKind } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";
import {
  type TeacherDashboardViewModel,
  type UseTeacherDashboardViewModelProps,
  useTeacherDashboardViewModel,
} from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { buildTeacherActiveMetricItems } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardMetrics";
import { useTeacherDashboardLastUpdated } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/useTeacherDashboardLastUpdated";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

type SupportRequestType = "COORDINATOR" | "SUPPORT";
type SnackbarSeverity = "success" | "error" | "info";

interface RawRow {
  readonly id?: string | null;
  readonly studentId?: string | null;
  readonly studentName?: string | null;
  readonly scheduledStartAt?: string | Date | null;
  readonly durationMinutes?: number | null;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly zoomMeetingUrl?: string | null;
  readonly yourTimeFormatted?: string | null;
}

interface RawFeedItem {
  readonly id?: string | null;
  readonly title?: string | null;
  readonly type?: string | null;
}

function mapRows(rows: readonly RawRow[] | null | undefined, todayDateStr: string) {
  if (!rows) return [];
  return rows.map((row, idx) => {
    const startAt = new Date(row.scheduledStartAt || todayDateStr);
    const endAt = new Date(startAt.getTime() + (row.durationMinutes || 60) * 60000);
    const startWindow = new Date(startAt.getTime() - 5 * 60000);
    const now = new Date();

    let status: "upcoming" | "completed" | "missed" | "activated" | "active" = "upcoming";
    if (row.outcome === "TAKEN" || row.outcome === "COMPLETED") {
      status = "completed";
    } else if (
      row.outcome === "ABSENT" ||
      row.outcome === "LEAVE" ||
      row.outcome === "CANCELLED" ||
      row.outcome === "MISSED"
    ) {
      status = "missed";
    } else if (row.executionState === "ACTIVATED") {
      status = "activated";
    } else if (row.executionState === "IN_PROGRESS") {
      status = "active";
    }

    const activateEnabled = now >= startWindow && now <= endAt && row.executionState === "NOT_ACTIVATED";

    return {
      id: row.id || `row-${idx}`,
      rowNumber: idx + 1,
      classId: row.id || "",
      studentId: row.studentId || "",
      studentName: row.studentName || "Unknown",
      studentInitials: row.studentName
        ? row.studentName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "ST",
      timeRange: row.yourTimeFormatted || startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status,
      videoEnabled: !!row.zoomMeetingUrl,
      activateEnabled,
      durationMinutes: row.durationMinutes ?? undefined,
      zoomMeetingUrl: row.zoomMeetingUrl ?? null,
      isLive: row.executionState === "ACTIVATED" || row.executionState === "IN_PROGRESS",
      isCurrent: row.executionState === "ACTIVATED" || row.executionState === "IN_PROGRESS",
    };
  });
}

function mapProgressFeed(feed: readonly RawFeedItem[] | null | undefined) {
  return (feed || []).map((f: RawFeedItem) => {
    let icon: "grade" | "login" | "description" = "description";
    const fType = f.type?.toLowerCase();
    if (fType === "quiz") {
      icon = "grade";
    } else if (fType === "login") {
      icon = "login";
    }

    return {
      id: f.id || "",
      studentId: f.id || "",
      studentName: f.title ? f.title.split(" ")[0] : "Student",
      studentInitials: f.title ? f.title.slice(0, 2).toUpperCase() : "ST",
      summary: f.title || "",
      scheduledTime: null,
      durationMinutes: null,
      eventKind: icon as unknown as TeacherProgressFeedEventKind,
      occurredAt: new Date(),
      timeAgo: "1m ago",
      infoTooltip: null,
    };
  });
}

const lazyViews = createLazyView<TeacherDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile").then(m => ({
      default: m.TeacherDashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/dashboard/teacherDashboard.desktop").then(m => ({
      default: m.TeacherDashboardDesktopView,
    }))
);

export function TeacherDashboardContainer() {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const dashboardT = useAppTranslation().dashboardTranslations.admin;
  const tJoin = useAppTranslation().uiTranslations.meetingConfigJoin;
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const userName = useUserStore(state => state.name);

  // NEW FOR PLAN v5: derived per-action permission booleans (specs.md §3 N3).
  // The Container owns the permission check; the resulting `has*` flags are
  // pushed into the TeacherDashboard Zustand store so the existing tier
  // consumers (teacherScheduleMobileCard / teacherScheduleDataGrid / etc.)
  // can keep reading from the store — and they are also passed through the
  // ViewModel as explicit props for the `TeacherActiveSessionControls*`,
  // `TeacherScheduleStatusContentMobile`, and
  // `TeacherScheduleSessionActionsCellDesktop` sub-components.
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

  // NEW FOR PLAN v5: lifted `absentDialogOpen` state from the tier-side
  // teacherActiveSessionControls.{mobile,desktop}.tsx components (specs.md
  // §3 N7 + §6.4). The store owns the boolean; the Container exposes
  // open/close callbacks through the ViewModel so tier views never call
  // `useState`. We read these via granular selectors alongside the
  // existing single destructure below to keep re-renders scoped.
  const absentDialogOpen = useTeacherDashboardStore(state => state.absentDialogOpen);
  const setAbsentDialogOpen = useTeacherDashboardStore(state => state.setAbsentDialogOpen);
  // NEW FOR PLAN v5: the controls' `onAbsentDialogOpen()` (no-arg) opens the
  // shared dialog with the captured row identity; the schedule cards push
  // `row.id` into the store via `onAbsentDialogOpenForClass`. The Container
  // then routes the confirm through `markAbsent(classInstanceId)` per the
  // captured identity, preserving per-row dispatch through shared state.
  const openAbsentDialogForClass = useTeacherDashboardStore(state => state.openAbsentDialogForClass);
  const absentDialogClassInstanceId = useTeacherDashboardStore(state => state.absentDialogClassInstanceId);

  const [activationError, setActivationError] = useState<string | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntryDefaultActive, setManualEntryDefaultActive] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("info");

  const { filterDate, setFilterDate, page, pageSize, setPage } = useTeacherDashboardStore();
  // Note: absentDialogOpen + setAbsentDialogOpen were extracted above via
  // granular selectors (specs.md §6.4 prefers selector subscriptions over
  // whole-store destructure to keep re-renders scoped).

  const paginationArgs = {
    first: pageSize,
    page: page + 1,
    after: null,
    before: null,
    last: null,
    maxCount: null,
    skip: null,
  };

  const { data: dashboardData, refetch } = useQuery(teacherDashboardQueryDocument, {
    variables: { date: filterDate, pagination: paginationArgs },
    fetchPolicy: "cache-and-network",
  });

  const [dataArrivedAt, setDataArrivedAt] = useState<number | null>(null);

  useEffect(() => {
    if (dashboardData?.teacherDashboard) {
      setDataArrivedAt(Date.now());
    }
  }, [dashboardData]);

  const lastUpdated = useTeacherDashboardLastUpdated(dataArrivedAt);

  const [handbookRequested, setHandbookRequested] = useState(false);
  const { data: handbookData, loading: handbookLoading } = useQuery(teacherHandbookUrlQueryDocument, {
    skip: !handbookRequested,
  });

  useEffect(() => {
    if (handbookRequested && !handbookLoading) {
      if (handbookData?.teacherHandbookUrl?.url) {
        globalThis.open(handbookData.teacherHandbookUrl.url, "_blank");
      } else {
        setSnackbarMessage(t.errors.handbookUrlNotFound);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
      setHandbookRequested(false);
    }
  }, [handbookRequested, handbookLoading, handbookData, t]);

  const [activateClass] = useMutation(activateClassMutationDocument);
  const [startClass] = useMutation(updateSessionStatusStartMutationDocument);
  const [markAbsent] = useMutation(updateSessionStatusAbsentMutationDocument);
  const [requestLeave] = useMutation(updateSessionStatusLeaveMutationDocument);
  const [createManualEntry] = useMutation(createTeacherManualClassEntryMutationDocument);
  const [logSupportRequest] = useMutation(logTeacherSupportRequestMutationDocument);

  const labels = buildTeacherDashboardLabels(t, dashboardT, tJoin.emptyTeacher);
  const canActivate = permissions.includes(AppPermission.SessionActivateClass);

  const dashboardId = dashboardData?.teacherDashboard?.id || "";
  const teacherId = dashboardId.split("-")[2] || "";

  const scheduleRows = mapRows(dashboardData?.teacherDashboard?.scheduleRows, filterDate);
  const totalCount = dashboardData?.teacherDashboard?.totalCount ?? 0;
  const dashboardMetrics = dashboardData?.teacherDashboard?.metrics;

  const missedRow = scheduleRows.find(r => r.status === "missed");
  const missedAlert = missedRow
    ? {
        classId: missedRow.classId,
        scheduledTime: missedRow.timeRange,
      }
    : null;

  const metricItems = buildTeacherActiveMetricItems(dashboardMetrics, labels.activeMetrics);

  const progressFeed: readonly StudentProgressFeedItem[] = mapProgressFeed(
    dashboardData?.teacherDashboard?.progressFeed
  );

  const handleActivate = async (id: string) => {
    setActivationError(null);
    try {
      await activateClass({ variables: { classInstanceId: id } });
      await refetch();
    } catch (err) {
      const error = err as Error;
      logger.error("Error activating class:", error);
      if (error.message?.includes("missedClassTime") || error.message?.toLowerCase().includes("missed class time")) {
        setActivationError(t.errors.missedClassTime);
      } else {
        setActivationError(t.errors.activationFailed);
      }
    }
  };

  const handleManualEntrySubmit = async (data: {
    studentId: string;
    subjectId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    durationMinutes: number;
    classType: string;
  }) => {
    if (!teacherId) {
      throw new Error(t.manualClassEntry.teacherIdNotFound);
    }
    await createManualEntry({
      variables: {
        input: {
          studentId: data.studentId,
          teacherId,
          subjectId: data.subjectId,
          scheduledStartAt: data.scheduledStartAt,
          scheduledEndAt: data.scheduledEndAt,
          durationMinutes: data.durationMinutes,
          classType: data.classType as unknown as ClassType | null,
        },
      },
    });
    await refetch();
  };

  const handleSupportRequest = async (type: SupportRequestType) => {
    try {
      await logSupportRequest({
        variables: {
          input: {
            reason: `${type}: Support request initiated from teacher dashboard.`,
          },
        },
      });
      setSnackbarMessage(t.supportRequestSubmitted(type.toLowerCase()));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      logger.error("Error logging support request:", err);
    }
  };

  const lessonReportI18n = useAppTranslation().dashboardTranslations.lmsLessonReports;
  const lessonReportLabels = {
    attendanceEvaluation: lessonReportI18n.attendanceEvaluation,
    durationMinutes: lessonReportI18n.durationMinutes,
    completionPercentage: lessonReportI18n.completionPercentage,
    teacherNotes: lessonReportI18n.teacherNotes,
    present: lessonReportI18n.present,
    absent: lessonReportI18n.absent,
    late: lessonReportI18n.late,
    submit: lessonReportI18n.submit,
    dialogTitle: lessonReportI18n.dialogTitle,
    cancel: lessonReportI18n.cancel,
    submitting: lessonReportI18n.submitting,
    submitFailed: lessonReportI18n.submitFailed,
    attendanceRequired: lessonReportI18n.attendanceRequired,
    durationMin: lessonReportI18n.durationMin,
    durationMax: lessonReportI18n.durationMax,
    completionMin: lessonReportI18n.completionMin,
    completionMax: lessonReportI18n.completionMax,
  };

  const props: UseTeacherDashboardViewModelProps = {
    userName,
    metricItems,
    scheduleRows,
    progressFeed,
    missedAlert,
    welcomeDateSummary: filterDate,
    activeSessionsCount: Number(metricItems.find(m => m.key === "activeSessions")?.count ?? 0),
    labels,
    lastUpdated,
    activationError,
    canActivate,
    canManualEntry: canActivate,
    canPrintSchedule: true,
    loading: dashboardData === undefined,
    onPrintSchedule: () => globalThis.print(),
    onManualEntry: () => {
      setManualEntryDefaultActive(false);
      setManualEntryOpen(true);
    },
    onNewSession: () => {
      setManualEntryDefaultActive(true);
      setManualEntryOpen(true);
    },
    manualEntryOpen,
    manualEntryDefaultActive,
    teacherId,
    onManualEntryClose: () => setManualEntryOpen(false),
    onManualEntrySubmit: handleManualEntrySubmit,
    onActivate: handleActivate,
    onStartSession: async (id: string) => {
      try {
        await startClass({ variables: { classInstanceId: id } });
        await refetch();
      } catch (err) {
        logger.error("Error starting session:", err);
      }
    },
    onMarkAbsent: async (id: string) => {
      try {
        await markAbsent({ variables: { classInstanceId: id } });
        await refetch();
      } catch (err) {
        logger.error("Error marking absent:", err);
      }
    },
    onRequestLeave: async (id: string) => {
      try {
        await requestLeave({
          variables: { classInstanceId: id, leaveReason: "Teacher requested leave from teacher dashboard" },
        });
        await refetch();
      } catch (err) {
        logger.error("Error requesting leave:", err);
      }
    },
    onViewAll: () => {
      router.push("/schedule");
    },
    onDownloadHandbook: () => {
      setHandbookRequested(true);
    },
    onContactCoordinator: () => handleSupportRequest("COORDINATOR"),
    onSupport: () => handleSupportRequest("SUPPORT"),
    dateValue: filterDate,
    onDateChange: setFilterDate,
    page,
    pageSize,
    totalCount,
    onPageChange: setPage,
    lessonReportDialogOpen: false,
    lessonReportSelectedClassInstanceId: null,
    lessonReportLabels,
    onLessonReportDialogClose: () => {},
    onLessonReportSubmit: async () => {},
    // NEW FOR PLAN v5: lifted permission booleans + absent-dialog state.
    hasSessionUpdateStatusStart,
    hasSessionUpdateStatusAbsent,
    hasSessionUpdateStatusLeave,
    hasSessionActivateClass,
    absentDialogOpen,
    onAbsentDialogOpen: () => openAbsentDialogForClass(absentDialogClassInstanceId ?? ""),
    onAbsentDialogOpenForClass: (id: string) => openAbsentDialogForClass(id),
    onAbsentDialogClose: () => setAbsentDialogOpen(false),
    onAbsentDialogConfirm: async () => {
      if (absentDialogClassInstanceId) {
        try {
          await markAbsent({ variables: { classInstanceId: absentDialogClassInstanceId } });
          await refetch();
        } catch (err) {
          logger.error("Error marking absent from dialog:", err);
        }
      }
      setAbsentDialogOpen(false);
    },
  };

  const viewModel = useTeacherDashboardViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </RequirePermission>
  );
}

export type { TeacherDashboardViewModel, UseTeacherDashboardViewModelProps };
