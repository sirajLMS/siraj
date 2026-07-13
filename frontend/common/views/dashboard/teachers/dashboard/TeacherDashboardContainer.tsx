"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import type { EffectiveMeeting } from "@/frontend/common/graphql/generated/gql/graphql-types";
import * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  activateClassMutationDocument,
  createTeacherManualClassEntryMutationDocument,
  logTeacherSupportRequestMutationDocument,
  submitLessonReportMutationDocument,
  teacherDashboardQueryDocument,
  teacherHandbookUrlQueryDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { LessonReportSubmitDialog } from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog";
import { ManualClassEntryDialog } from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import { TeacherDashboardView } from "@/frontend/common/views/dashboard/teachers/dashboard/teacherDashboardView";
import type {
  LessonReportFormLabels,
  LessonReportFormSubmitInput,
} from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";
import { buildStudentProgressFeedItems } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildStudentProgressFeedItems";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { buildTeacherActiveMetricItems } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardMetrics";
import { useTeacherDashboardLastUpdated } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/useTeacherDashboardLastUpdated";
import type { TeacherScheduleRow } from "@/frontend/common/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { DEFAULT_MISSED_GRACE_MINUTES } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

type SupportRequestType = "COORDINATOR" | "SUPPORT";
type SnackbarSeverity = "success" | "error" | "info";
type StringOrDateOrNull = string | Date | null;

const ACTIVATION_WINDOW_BEFORE_MINUTES = 5;
const ABSENT_WAITING_MINUTES = 30;

interface RawRow {
  readonly id?: string | null;
  readonly studentId?: string | null;
  readonly studentName?: string | null;
  readonly scheduledStartAt?: StringOrDateOrNull;
  readonly scheduledEndAt?: StringOrDateOrNull;
  readonly durationMinutes?: number | null;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly isFrozen?: boolean | null;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeeting | null;
  readonly yourTimeFormatted?: string | null;
}

function resolveMeetingJoinUrl(
  meetingJoinUrl?: string | null,
  effectiveMeeting?: EffectiveMeeting | null
): string | null {
  const fromEffective = effectiveMeeting?.joinUrl?.trim();
  const fromLegacy = meetingJoinUrl?.trim();
  return fromEffective || fromLegacy || null;
}

interface RawFeedItem {
  readonly id?: string | null;
  readonly studentId?: string | null;
  readonly studentName?: string | null;
  readonly scheduledTimeFormatted?: string | null;
  readonly durationMinutes?: number | null;
  readonly eventKind?: string | null;
  readonly occurredAt?: StringOrDateOrNull;
}

function deriveRowStatus(
  executionState: Types.ClassExecutionState,
  outcome: Types.ClassOutcome,
  activateEnabled: boolean,
  now: Date,
  endAt: Date
): TeacherScheduleRow["status"] {
  if (outcome === Types.ClassOutcome.Taken || executionState === Types.ClassExecutionState.Completed) {
    return "completed";
  }
  if (outcome === Types.ClassOutcome.Absent || outcome === Types.ClassOutcome.Leave) {
    return "missed";
  }
  if (executionState === Types.ClassExecutionState.Activated) {
    return "activated";
  }
  if (executionState === Types.ClassExecutionState.Running) {
    return "active";
  }
  if (executionState === Types.ClassExecutionState.NotActivated && outcome === Types.ClassOutcome.Pending) {
    const missedDeadline = new Date(endAt.getTime() + DEFAULT_MISSED_GRACE_MINUTES * 60000);
    if (now > missedDeadline) {
      return "missed";
    }
    return activateEnabled ? "pending" : "upcoming";
  }
  return "upcoming";
}

function mapRows(rows: readonly RawRow[] | null | undefined, todayDateStr: string): TeacherScheduleRow[] {
  if (!rows) return [];
  return rows.map((row, idx) => {
    const startAt = new Date(row.scheduledStartAt || todayDateStr);
    const endAt = row.scheduledEndAt
      ? new Date(row.scheduledEndAt)
      : new Date(startAt.getTime() + (row.durationMinutes || 60) * 60000);
    const startWindow = new Date(startAt.getTime() - ACTIVATION_WINDOW_BEFORE_MINUTES * 60000);
    const now = new Date();

    const executionState: Types.ClassExecutionState =
      (row.executionState as Types.ClassExecutionState | null) ?? Types.ClassExecutionState.NotActivated;
    const outcome: Types.ClassOutcome = (row.outcome as Types.ClassOutcome | null) ?? Types.ClassOutcome.Pending;
    const activateEnabled =
      now >= startWindow &&
      now <= endAt &&
      executionState === Types.ClassExecutionState.NotActivated &&
      outcome === Types.ClassOutcome.Pending;

    let activateDisabledReason: TeacherScheduleRow["activateDisabledReason"] = null;
    if (
      executionState === Types.ClassExecutionState.NotActivated &&
      outcome === Types.ClassOutcome.Pending &&
      !activateEnabled
    ) {
      activateDisabledReason = now < startWindow ? "before_window" : "after_window";
    }

    const isLiveSession =
      executionState === Types.ClassExecutionState.Activated || executionState === Types.ClassExecutionState.Running;
    const absentWaitingDeadline = new Date(startAt.getTime() + ABSENT_WAITING_MINUTES * 60000);
    const markAbsentEnabled = !isLiveSession || now >= absentWaitingDeadline;

    const status = deriveRowStatus(executionState, outcome, activateEnabled, now, endAt);

    const joinUrl = resolveMeetingJoinUrl(row.meetingJoinUrl, row.effectiveMeeting);

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
      executionState,
      outcome,
      videoEnabled: Boolean(joinUrl),
      activateEnabled,
      activateDisabledReason,
      markAbsentEnabled,
      durationMinutes: row.durationMinutes ?? undefined,
      scheduledStartAt: row.scheduledStartAt ? new Date(row.scheduledStartAt) : undefined,
      scheduledEndAt: row.scheduledEndAt ? new Date(row.scheduledEndAt) : endAt,
      meetingJoinUrl: joinUrl,
      effectiveMeeting: row.effectiveMeeting ?? null,
      isFrozen: row.isFrozen ?? false,
      isLive: isLiveSession,
      isCurrent: isLiveSession,
    };
  });
}

function mapProgressFeed(
  feed: readonly RawFeedItem[] | null | undefined,
  labels: ReturnType<typeof buildTeacherDashboardLabels>["progressFeed"],
  durationTemplate: string,
  formatRelativeTime: (value: Date) => string
) {
  return buildStudentProgressFeedItems(feed, labels, durationTemplate, formatRelativeTime);
}

export function TeacherDashboardContainer() {
  const t = useTranslations("dashboard.teacherDashboard");
  const dashboardT = useTranslations("dashboard");
  const tJoin = useTranslations("ui.meetingConfig.join");
  const formatter = useFormatter();
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const userName = useUserStore(state => state.name);

  const [activationError, setActivationError] = useState<string | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntryDefaultActive, setManualEntryDefaultActive] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("info");
  const [lessonReportOpen, setLessonReportOpen] = useState(false);
  const [lessonReportClassInstanceId, setLessonReportClassInstanceId] = useState<string | null>(null);

  const { filterDate, setFilterDate, page, pageSize, setPage } = useTeacherDashboardStore();

  const paginationArgs: Types.PaginationArgs = {
    first: pageSize,
    page: page + 1,
    after: null,
    before: null,
    last: null,
    maxCount: null,
    skip: null,
  };

  const {
    data: dashboardData,
    loading: dashboardLoading,
    refetch,
  } = useQuery(teacherDashboardQueryDocument, {
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
        setSnackbarMessage(t("errors.handbookUrlNotFound"));
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
  const [submitLessonReport] = useMutation(submitLessonReportMutationDocument);

  const labels = buildTeacherDashboardLabels(t, dashboardT, tJoin("emptyTeacher"));
  const lessonReportI18n = useTranslations("dashboard.lms.lessonReports");
  const lessonReportLabels: LessonReportFormLabels = useMemo(
    () => ({
      attendanceEvaluation: lessonReportI18n("attendanceEvaluation"),
      durationMinutes: lessonReportI18n("durationMinutes"),
      completionPercentage: lessonReportI18n("completionPercentage"),
      teacherNotes: lessonReportI18n("teacherNotes"),
      present: lessonReportI18n("present"),
      absent: lessonReportI18n("absent"),
      late: lessonReportI18n("late"),
      submit: lessonReportI18n("submit"),
      dialogTitle: lessonReportI18n("dialogTitle"),
      cancel: lessonReportI18n("cancel"),
      submitting: lessonReportI18n("submitting"),
      submitFailed: lessonReportI18n("submitFailed"),
      attendanceRequired: lessonReportI18n("attendanceRequired"),
      durationMin: lessonReportI18n("durationMin"),
      durationMax: lessonReportI18n("durationMax"),
      completionMin: lessonReportI18n("completionMin"),
      completionMax: lessonReportI18n("completionMax"),
    }),
    [lessonReportI18n]
  );
  const canActivate = permissions.includes(Types.AppPermission.SessionActivateClass);

  const dashboardId = dashboardData?.teacherDashboard?.id || "";
  const teacherId = dashboardId.split("-")[2] || "";

  const scheduleRows = mapRows(dashboardData?.teacherDashboard?.scheduleRows, filterDate);
  const totalCount = dashboardData?.teacherDashboard ? (dashboardData.teacherDashboard.totalCount ?? 0) : undefined;
  const dashboardMetrics = dashboardData?.teacherDashboard?.metrics;
  const metricItems = buildTeacherActiveMetricItems(dashboardMetrics, labels.activeMetrics);

  const missedRow = scheduleRows.find(r => r.status === "missed");
  const missedAlert = missedRow
    ? {
        classId: missedRow.classId,
        scheduledTime: missedRow.timeRange,
      }
    : null;

  const progressFeed = useMemo(() => {
    if (dataArrivedAt === null) {
      return [];
    }

    return mapProgressFeed(
      dashboardData?.teacherDashboard?.progressFeed,
      labels.progressFeed,
      labels.schedule.durationValue,
      value => formatter.relativeTime(value, { now: dataArrivedAt })
    );
  }, [
    dashboardData?.teacherDashboard?.progressFeed,
    dataArrivedAt,
    formatter,
    labels.progressFeed,
    labels.schedule.durationValue,
  ]);

  const handleDateChange = (date: string) => {
    setFilterDate(date);
  };

  const handleMarkClassCompleted = (classInstanceId: string) => {
    setLessonReportClassInstanceId(classInstanceId);
    setLessonReportOpen(true);
  };

  const handleLessonReportClose = () => {
    setLessonReportOpen(false);
    setLessonReportClassInstanceId(null);
  };

  const handleLessonReportSubmit = async (input: LessonReportFormSubmitInput) => {
    await submitLessonReport({
      variables: {
        classInstanceId: input.classInstanceId,
        input: {
          classInstanceId: input.classInstanceId,
          attendanceEvaluation: input.attendanceEvaluation as Types.AttendanceEvaluation,
          durationMinutes: input.durationMinutes,
          completionPercentage: input.completionPercentage,
          teacherNotes: input.teacherNotes ?? null,
        },
      },
    });
    setSnackbarMessage(lessonReportI18n("submitReport"));
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    await refetch();
  };

  const selectedLessonReportRow = lessonReportClassInstanceId
    ? scheduleRows.find(r => r.classId === lessonReportClassInstanceId)
    : null;

  const handleActivate = async (id: string) => {
    setActivationError(null);
    try {
      await activateClass({ variables: { classInstanceId: id } });
      await refetch();
    } catch (err) {
      const error = err as Error;
      logger.error("Error activating class:", error);
      if (error.message?.includes("missedClassTime") || error.message?.toLowerCase().includes("missed class time")) {
        setActivationError(t("errors.missedClassTime"));
      } else {
        setActivationError(t("errors.activationFailed"));
      }
    }
  };

  const handleManualEntrySubmit = async (data: {
    studentId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    durationMinutes: number;
    classType: string;
  }) => {
    if (!teacherId) {
      throw new Error(t("manualClassEntry.teacherIdNotFound"));
    }
    await createManualEntry({
      variables: {
        input: {
          studentId: data.studentId,
          teacherId,
          scheduledStartAt: data.scheduledStartAt,
          scheduledEndAt: data.scheduledEndAt,
          durationMinutes: data.durationMinutes,
          classType: data.classType as Types.ClassType,
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
      setSnackbarMessage(t("supportRequestSubmitted", { type: type.toLowerCase() }));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      logger.error("Error logging support request:", err);
    }
  };

  return (
    <RequirePermission permissions={[Types.AppPermission.TeacherViewDashboard]}>
      <TeacherDashboardView
        userName={userName}
        metricItems={metricItems}
        scheduleRows={scheduleRows}
        progressFeed={progressFeed}
        missedAlert={missedAlert}
        welcomeDateSummary={filterDate}
        activeSessionsCount={dashboardMetrics?.running ?? 0}
        labels={labels}
        lastUpdated={lastUpdated}
        activationError={activationError}
        canActivate={canActivate}
        canManualEntry={canActivate}
        canPrintSchedule={true}
        loading={dashboardLoading}
        onPrintSchedule={() => {
          globalThis.print();
        }}
        onManualEntry={() => {
          setManualEntryDefaultActive(false);
          setManualEntryOpen(true);
        }}
        onNewSession={() => {
          setManualEntryDefaultActive(true);
          setManualEntryOpen(true);
        }}
        onActivate={handleActivate}
        onStartSession={async id => {
          try {
            await startClass({ variables: { classInstanceId: id } });
            await refetch();
          } catch (err) {
            logger.error("Error starting session:", err);
          }
        }}
        onMarkAbsent={async id => {
          try {
            await markAbsent({ variables: { classInstanceId: id } });
            await refetch();
          } catch (err) {
            logger.error("Error marking absent:", err);
          }
        }}
        onRequestLeave={async id => {
          try {
            await requestLeave({
              variables: { classInstanceId: id, leaveReason: "Teacher requested leave from teacher dashboard" },
            });
            await refetch();
          } catch (err) {
            logger.error("Error requesting leave:", err);
          }
        }}
        onMarkClassCompleted={handleMarkClassCompleted}
        onViewAll={() => {
          router.push("/schedule");
        }}
        onDownloadHandbook={() => {
          setHandbookRequested(true);
        }}
        onContactCoordinator={() => handleSupportRequest("COORDINATOR")}
        onSupport={() => handleSupportRequest("SUPPORT")}
        dateValue={filterDate}
        onDateChange={handleDateChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        lessonReportDialogOpen={lessonReportOpen}
        lessonReportSelectedClassInstanceId={lessonReportClassInstanceId}
        lessonReportDefaultDurationMinutes={selectedLessonReportRow?.durationMinutes}
        lessonReportLabels={lessonReportLabels}
        onLessonReportDialogClose={handleLessonReportClose}
        onLessonReportSubmit={handleLessonReportSubmit}
      />
      <ManualClassEntryDialog
        open={manualEntryOpen}
        onClose={() => setManualEntryOpen(false)}
        teacherId={teacherId}
        onSubmit={handleFormSubmit => handleManualEntrySubmit(handleFormSubmit)}
        defaultActive={manualEntryDefaultActive}
      />
      {lessonReportClassInstanceId && (
        <LessonReportSubmitDialog
          open={lessonReportOpen}
          onClose={handleLessonReportClose}
          classInstanceId={lessonReportClassInstanceId}
          defaultDurationMinutes={selectedLessonReportRow?.durationMinutes}
          labels={lessonReportLabels}
          onSubmit={handleLessonReportSubmit}
        />
      )}
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
