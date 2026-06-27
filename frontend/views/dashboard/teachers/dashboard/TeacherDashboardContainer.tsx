"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import { useRouter } from "@/shared/i18n/routing";

type SupportRequestType = "COORDINATOR" | "SUPPORT";
type SnackbarSeverity = "success" | "error" | "info";

import {
  activateClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/graphql/sharedDocuments/class-session.documents";
import {
  createTeacherManualClassEntryMutationDocument,
  logTeacherSupportRequestMutationDocument,
  teacherActiveDashboardQueryDocument,
  teacherDashboardQueryDocument,
  teacherHandbookUrlQueryDocument,
} from "@/frontend/graphql/sharedDocuments/teacher-dashboard.documents";
import { useTeacherDashboardStore } from "@/frontend/stores/teacherDashboardStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import type { TeacherScheduleRow } from "@/frontend/views/dashboard/types/dashboard";
import { ManualClassEntryDialog } from "./components/ManualClassEntryDialog";
import { TeacherDashboardActiveView } from "./TeacherDashboardActiveView";
import { TeacherDashboardView } from "./TeacherDashboardView";
import type { TeacherDashboardLabels } from "./types/teacherDashboardLabels";
import { buildTeacherDashboardLabels } from "./utils/buildTeacherDashboardLabels";
import { resolveTeacherDashboardMode, shouldRenderTeacherDashboard } from "./utils/teacherDashboardMode";

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

function mapRows(
  rows: readonly RawRow[] | null | undefined,
  todayDateStr: string,
  mode: "standard" | "active" | null
): TeacherScheduleRow[] {
  if (!rows) return [];
  return rows.map((row, idx) => {
    const startAt = new Date(row.scheduledStartAt || todayDateStr);
    const endAt = new Date(startAt.getTime() + (row.durationMinutes || 60) * 60000);
    const startWindow = new Date(startAt.getTime() - 5 * 60000);
    const now = new Date();

    let status: TeacherScheduleRow["status"] = "upcoming";
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
    } else if (mode === "active") {
      status = "pending";
    }

    const activateEnabled = now >= startWindow && now <= endAt && row.executionState === "NOT_ACTIVATED";

    return {
      id: row.id || `row-${idx}`,
      rowNumber: idx + 1,
      classId: `#CLS-${row.id}`,
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

interface ActiveDashboardWrapperProps {
  readonly userName: string;
  readonly activeData: Operations.TeacherActiveDashboardQuery | undefined;
  readonly filterDate: string;
  readonly labels: TeacherDashboardLabels;
  readonly activationError: string | null;
  readonly handleActivate: (id: string) => Promise<void>;
  readonly setManualEntryDefaultActive: (val: boolean) => void;
  readonly setManualEntryOpen: (val: boolean) => void;
  readonly startClass: (options: {
    readonly variables: Types.MutationUpdateSessionStatusStartArgs;
  }) => Promise<unknown>;
  readonly markAbsent: (options: {
    readonly variables: Types.MutationUpdateSessionStatusAbsentArgs;
  }) => Promise<unknown>;
  readonly requestLeave: (options: {
    readonly variables: Types.MutationUpdateSessionStatusLeaveArgs;
  }) => Promise<unknown>;
  readonly refetchActive: (variables?: Partial<Types.QueryTeacherActiveDashboardArgs>) => Promise<{
    readonly data?: Operations.TeacherActiveDashboardQuery | null;
    readonly error?: unknown;
  }>;
  readonly onDateChange: (date: string) => void;
  readonly onViewAll: () => void;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

function ActiveDashboardWrapper({
  userName,
  activeData,
  filterDate,
  labels,
  activationError,
  handleActivate,
  setManualEntryDefaultActive,
  setManualEntryOpen,
  startClass,
  markAbsent,
  requestLeave,
  refetchActive,
  onDateChange,
  onViewAll,
  page,
  pageSize,
  onPageChange,
}: Readonly<ActiveDashboardWrapperProps>) {
  const activeMetrics = activeData?.teacherActiveDashboard?.metrics;
  const scheduleRows = mapRows(activeData?.teacherActiveDashboard?.scheduleRows, filterDate, "active");
  const totalCount = activeData?.teacherActiveDashboard?.totalCount ?? 0;

  const feed = (activeData?.teacherActiveDashboard?.progressFeed || []).map((f: RawFeedItem) => {
    let icon: "grade" | "login" | "description" = "description";
    const fType = f.type?.toLowerCase();
    if (fType === "quiz") {
      icon = "grade";
    } else if (fType === "login") {
      icon = "login";
    }

    return {
      id: f.id || "",
      studentName: f.title ? f.title.split(" ")[0] : "Student",
      studentInitials: f.title ? f.title.slice(0, 2).toUpperCase() : "ST",
      summary: f.title || "",
      timeAgo: "1m ago",
      icon,
    };
  });

  const activeViewMetrics = {
    totalClasses: activeMetrics?.total ?? 0,
    activeSessions: activeMetrics?.running ?? 0,
    missedSlots: activeMetrics?.absent ?? 0,
    completed: activeMetrics?.taken ?? 0,
    studentsToday: new Set(scheduleRows.map(r => r.studentId)).size,
  };

  return (
    <TeacherDashboardActiveView
      userName={userName}
      metrics={activeViewMetrics}
      scheduleRows={scheduleRows}
      progressFeed={feed}
      welcomeDateSummary={filterDate}
      sessionsScheduledToday={scheduleRows.length}
      labels={labels}
      onActivate={handleActivate}
      dateValue={filterDate}
      onDateChange={onDateChange}
      onNewSession={() => {
        setManualEntryDefaultActive(true);
        setManualEntryOpen(true);
      }}
      onStartSession={async id => {
        try {
          await startClass({ variables: { classInstanceId: id } });
          await refetchActive();
        } catch (err) {
          logger.error("Error starting session:", err);
        }
      }}
      onMarkAbsent={async id => {
        try {
          await markAbsent({ variables: { classInstanceId: id } });
          await refetchActive();
        } catch (err) {
          logger.error("Error marking absent:", err);
        }
      }}
      onRequestLeave={async id => {
        try {
          await requestLeave({
            variables: { classInstanceId: id, leaveReason: "Teacher requested leave from active dashboard" },
          });
          await refetchActive();
        } catch (err) {
          logger.error("Error requesting leave:", err);
        }
      }}
      activationError={activationError}
      onViewAll={onViewAll}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
    />
  );
}

interface StandardDashboardWrapperProps {
  readonly standardData: Operations.TeacherDashboardQuery | undefined;
  readonly filterDate: string;
  readonly permissions: readonly AppPermission[];
  readonly labels: TeacherDashboardLabels;
  readonly handleActivate: (id: string) => Promise<void>;
  readonly handleDownloadHandbook: () => Promise<void>;
  readonly handleSupportRequest: (type: SupportRequestType) => Promise<void>;
  readonly showSnackbar: (message: string, severity: SnackbarSeverity) => void;
  readonly t: ReturnType<typeof useTranslations<"dashboard.teacherDashboard">>;
  readonly setManualEntryDefaultActive: (val: boolean) => void;
  readonly setManualEntryOpen: (val: boolean) => void;
  readonly onDateChange: (date: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

function StandardDashboardWrapper({
  standardData,
  filterDate,
  permissions,
  labels,
  handleActivate,
  handleDownloadHandbook,
  handleSupportRequest,
  showSnackbar,
  t: tFunc,
  setManualEntryDefaultActive,
  setManualEntryOpen,
  onDateChange,
  page,
  pageSize,
  onPageChange,
}: Readonly<StandardDashboardWrapperProps>) {
  const standardMetrics = standardData?.teacherDashboard?.metrics;
  const scheduleRows = mapRows(standardData?.teacherDashboard?.scheduleRows, filterDate, "standard");
  const totalCount = standardData?.teacherDashboard?.totalCount ?? 0;
  const missedRow = scheduleRows.find(r => r.status === "missed");
  const missedAlert = missedRow
    ? {
        classId: missedRow.classId,
        scheduledTime: missedRow.timeRange,
      }
    : null;

  const viewMetrics = {
    totalClasses: standardMetrics?.total ?? 0,
    missedSlots: standardMetrics?.absent ?? 0,
    completed: standardMetrics?.taken ?? 0,
    studentsToday: new Set(scheduleRows.map(r => r.studentId)).size,
  };

  return (
    <TeacherDashboardView
      metrics={viewMetrics}
      scheduleRows={scheduleRows}
      missedAlert={missedAlert}
      scheduleDateLabel={filterDate}
      labels={labels}
      canActivate={permissions.includes(AppPermission.SessionActivateClass)}
      canManualEntry={permissions.includes(AppPermission.SessionActivateClass)}
      canPrintSchedule={true}
      onPrintSchedule={() => {
        globalThis.print();
      }}
      onManualEntry={() => {
        setManualEntryDefaultActive(false);
        setManualEntryOpen(true);
      }}
      onJoinVideo={id => {
        const row = scheduleRows.find(r => r.id === id);
        if (row?.zoomMeetingUrl) {
          globalThis.open(row.zoomMeetingUrl, "_blank");
        } else {
          showSnackbar(tFunc("errors.meetingUrlNotAvailable"), "error");
        }
      }}
      onActivate={handleActivate}
      onDownloadHandbook={handleDownloadHandbook}
      onContactCoordinator={() => handleSupportRequest("COORDINATOR")}
      onSupport={() => handleSupportRequest("SUPPORT")}
      dateValue={filterDate}
      onDateChange={onDateChange}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
    />
  );
}

export function TeacherDashboardContainer() {
  const t = useTranslations("dashboard.teacherDashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const permissions = useUserStore(state => state.permissions);
  const userName = useUserStore(state => state.name);

  const [activationError, setActivationError] = useState<string | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntryDefaultActive, setManualEntryDefaultActive] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("info");

  const { filterDate, setFilterDate, page, pageSize, setPage } = useTeacherDashboardStore();
  const mode = resolveTeacherDashboardMode(permissions, modeParam);

  const paginationArgs: Types.PaginationArgs = {
    first: pageSize,
    page: page + 1,
    after: null,
    before: null,
    last: null,
    maxCount: null,
    skip: null,
  };

  const { data: standardData, refetch: refetchStandard } = useQuery(teacherDashboardQueryDocument, {
    variables: { date: filterDate, pagination: paginationArgs },
    skip: mode !== "standard",
    fetchPolicy: "cache-and-network",
  });

  const { data: activeData, refetch: refetchActive } = useQuery(teacherActiveDashboardQueryDocument, {
    variables: { date: filterDate, pagination: paginationArgs },
    skip: mode !== "active",
    fetchPolicy: "cache-and-network",
  });

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

  if (!shouldRenderTeacherDashboard(permissions, modeParam)) {
    return null;
  }

  const labels = buildTeacherDashboardLabels(t);
  const canControl = permissions.includes(AppPermission.SessionActivateClass);

  const dashboardId = standardData?.teacherDashboard?.id || activeData?.teacherActiveDashboard?.id || "";
  const teacherId = dashboardId.split("-")[2] || "";

  const handleActivate = async (id: string) => {
    setActivationError(null);
    try {
      await activateClass({ variables: { classInstanceId: id } });
      if (mode === "active") {
        await refetchActive();
      } else {
        await refetchStandard();
      }
    } catch (err) {
      const error = err as Error;
      logger.error("Error activating class:", error);
      if (error.message?.includes("missedClassTime") || error.message?.toLowerCase().includes("missed class time")) {
        setActivationError(t("errors.missedClassTime") || "YOU MISSED THE CLASS TIME");
      } else {
        setActivationError(error.message || "An error occurred while activating the class.");
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
      throw new Error("Teacher ID could not be resolved.");
    }
    await createManualEntry({
      variables: {
        input: {
          studentId: data.studentId,
          teacherId,
          scheduledStartAt: data.scheduledStartAt,
          scheduledEndAt: data.scheduledEndAt,
          durationMinutes: data.durationMinutes,
          classType: data.classType,
        },
      },
    });
    if (mode === "active") {
      await refetchActive();
    } else {
      await refetchStandard();
    }
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

  const handleDownloadHandbook = async () => {
    setHandbookRequested(true);
  };

  const handleViewAll = () => {
    router.push("/schedule");
  };

  const showSnackbar = (message: string, severity: SnackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      {mode === "active" && canControl ? (
        <ActiveDashboardWrapper
          userName={userName}
          activeData={activeData as Operations.TeacherActiveDashboardQuery | undefined}
          filterDate={filterDate}
          labels={labels}
          activationError={activationError}
          handleActivate={handleActivate}
          setManualEntryDefaultActive={setManualEntryDefaultActive}
          setManualEntryOpen={setManualEntryOpen}
          startClass={startClass}
          markAbsent={markAbsent}
          requestLeave={requestLeave}
          refetchActive={refetchActive}
          onDateChange={setFilterDate}
          onViewAll={handleViewAll}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      ) : (
        <StandardDashboardWrapper
          standardData={standardData as Operations.TeacherDashboardQuery | undefined}
          filterDate={filterDate}
          permissions={permissions}
          labels={labels}
          handleActivate={handleActivate}
          handleDownloadHandbook={handleDownloadHandbook}
          handleSupportRequest={handleSupportRequest}
          showSnackbar={showSnackbar}
          t={t}
          setManualEntryDefaultActive={setManualEntryDefaultActive}
          setManualEntryOpen={setManualEntryOpen}
          onDateChange={setFilterDate}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
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
