"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import {
  activateClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/graphql/sharedDocuments/class-session.documents";
import {
  createTeacherManualClassEntryMutationDocument,
  logTeacherSupportRequestMutationDocument,
  teacherDashboardQueryDocument,
  teacherHandbookUrlQueryDocument,
} from "@/frontend/graphql/sharedDocuments/teacher-dashboard.documents";
import { useTeacherDashboardStore } from "@/frontend/stores/teacherDashboardStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import type { TeacherScheduleRow } from "@/frontend/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { DEFAULT_MISSED_GRACE_MINUTES } from "@/shared/lib/schedule-instance-dashboard-status";
import { ManualClassEntryDialog } from "./components/ManualClassEntryDialog";
import { TeacherDashboardView } from "./TeacherDashboardView";
import { buildStudentProgressFeedItems } from "./utils/buildStudentProgressFeedItems";
import { buildTeacherDashboardLabels } from "./utils/buildTeacherDashboardLabels";
import { buildTeacherActiveMetricItems } from "./utils/buildTeacherDashboardMetrics";
import { useTeacherDashboardLastUpdated } from "./utils/useTeacherDashboardLastUpdated";

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
  readonly zoomMeetingUrl?: string | null;
  readonly yourTimeFormatted?: string | null;
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
  executionState: string,
  outcome: string,
  activateEnabled: boolean,
  now: Date,
  endAt: Date
): TeacherScheduleRow["status"] {
  if (outcome === "TAKEN" || executionState === "COMPLETED") {
    return "completed";
  }
  if (outcome === "ABSENT" || outcome === "LEAVE") {
    return "missed";
  }
  if (executionState === "ACTIVATED") {
    return "activated";
  }
  if (executionState === "RUNNING") {
    return "active";
  }
  if (executionState === "NOT_ACTIVATED" && outcome === "PENDING") {
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

    const executionState = row.executionState ?? "NOT_ACTIVATED";
    const outcome = row.outcome ?? "PENDING";
    const activateEnabled =
      now >= startWindow && now <= endAt && executionState === "NOT_ACTIVATED" && outcome === "PENDING";

    let activateDisabledReason: TeacherScheduleRow["activateDisabledReason"] = null;
    if (executionState === "NOT_ACTIVATED" && outcome === "PENDING" && !activateEnabled) {
      activateDisabledReason = now < startWindow ? "before_window" : "after_window";
    }

    const isLiveSession = executionState === "ACTIVATED" || executionState === "RUNNING";
    const absentWaitingDeadline = new Date(startAt.getTime() + ABSENT_WAITING_MINUTES * 60000);
    const markAbsentEnabled = !isLiveSession || now >= absentWaitingDeadline;

    const status = deriveRowStatus(executionState, outcome, activateEnabled, now, endAt);

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
      videoEnabled: !!row.zoomMeetingUrl,
      activateEnabled,
      activateDisabledReason,
      markAbsentEnabled,
      durationMinutes: row.durationMinutes ?? undefined,
      scheduledStartAt: row.scheduledStartAt ? new Date(row.scheduledStartAt) : undefined,
      scheduledEndAt: row.scheduledEndAt ? new Date(row.scheduledEndAt) : endAt,
      zoomMeetingUrl: row.zoomMeetingUrl ?? null,
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

  const labels = buildTeacherDashboardLabels(t, dashboardT);
  const canActivate = permissions.includes(Types.AppPermission.SessionActivateClass);

  const dashboardId = dashboardData?.teacherDashboard?.id || "";
  const teacherId = dashboardId.split("-")[2] || "";

  const scheduleRows = mapRows(dashboardData?.teacherDashboard?.scheduleRows, filterDate);
  const totalCount = dashboardData?.teacherDashboard?.totalCount ?? 0;
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

  const showSnackbar = (message: string, severity: SnackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
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
        onJoinVideo={id => {
          const row = scheduleRows.find(r => r.id === id);
          if (row?.zoomMeetingUrl) {
            globalThis.open(row.zoomMeetingUrl, "_blank");
          } else {
            showSnackbar(t("errors.meetingUrlNotAvailable"), "error");
          }
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
      />
      <ManualClassEntryDialog
        open={manualEntryOpen}
        onClose={() => setManualEntryOpen(false)}
        teacherId={teacherId}
        onSubmit={handleFormSubmit => handleManualEntrySubmit(handleFormSubmit)}
        defaultActive={manualEntryDefaultActive}
      />
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
