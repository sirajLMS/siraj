"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { parentDashboardScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useParentDashboardStore } from "@/frontend/stores/parentDashboardStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ParentDashboardView } from "./ParentDashboardView";
import type { ParentScheduleRow } from "./types/parentDashboardTypes";

function mapExecutionStateToLiveClassStatus(
  executionState: string,
  outcome: string
): "starting_soon" | "pending" | "scheduled" {
  if (executionState === "ACTIVATED") return "starting_soon";
  if (outcome === "PENDING") return "pending";
  return "scheduled";
}

export function ParentDashboardContainer() {
  const t = useTranslations("dashboard.parentDashboard");
  const userName = useUserStore(state => state.name);
  const metrics = useParentDashboardStore(state => state.metrics);
  const studentProgress = useParentDashboardStore(state => state.studentProgress);
  const workshopPromo = useParentDashboardStore(state => state.workshopPromo);
  const page = useParentDashboardStore(state => state.page);
  const pageSize = useParentDashboardStore(state => state.pageSize);
  const setPage = useParentDashboardStore(state => state.setPage);
  const setScheduleTotalCount = useParentDashboardStore(state => state.setScheduleTotalCount);

  const paginationArgs = useMemo(
    () => ({
      page: page + 1,
      first: pageSize,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    }),
    [page, pageSize]
  );

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const { data } = useQuery(parentDashboardScheduleQueryDocument, {
    variables: { date: today, search: null, paginationArgs },
    fetchPolicy: "cache-and-network",
  });

  const scheduleRows: readonly ParentScheduleRow[] = useMemo(() => {
    const rows = data?.parentDashboardSchedule?.rows;
    if (!rows) return [];
    return rows.map(r => ({
      id: r.id ?? "",
      rowNumber: 0,
      classTime: r.classTimeFormatted ?? "",
      durationMinutes: r.durationMinutes ?? 0,
      studentName: r.studentName ?? "",
      studentInitials: r.studentInitials ?? "",
      studentAvatarUrl: r.studentAvatarUrl ?? undefined,
      teacherName: r.teacherName ?? "",
      bookingStatus: (r.bookingStatus === "rescheduled" ? "rescheduled" : "confirmed") as "confirmed" | "rescheduled",
      liveClassStatus: mapExecutionStateToLiveClassStatus(r.executionState ?? "", r.outcome ?? ""),
      videoEnabled: !!r.zoomMeetingUrl,
    }));
  }, [data]);

  const totalCount = data?.parentDashboardSchedule?.totalCount ?? 0;

  if (totalCount !== useParentDashboardStore.getState().scheduleTotalCount) {
    setScheduleTotalCount(totalCount);
  }

  const handleFilter = () => {
    logger.info("Parent dashboard filter clicked");
  };

  const handleViewFullWeek = () => {
    logger.info("Parent dashboard view full week clicked");
  };

  const handleViewAll = () => {
    logger.info("Parent dashboard view all schedule clicked");
  };

  const handleHistory = (id: string) => {
    logger.info("Parent dashboard history clicked", { id });
  };

  const handleJoinVideo = (id: string) => {
    logger.info("Parent dashboard join video clicked", { id });
  };

  const handleDownloadReport = () => {
    logger.info("Parent dashboard download report clicked");
  };

  const handleLearnMore = () => {
    logger.info("Parent dashboard workshop learn more clicked");
  };

  const handleSupport = () => {
    logger.info("Parent dashboard live support clicked");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <ParentDashboardView
      userName={userName}
      metrics={metrics}
      scheduleRows={scheduleRows}
      studentProgress={studentProgress}
      workshopPromo={workshopPromo}
      schedulePagination={{
        page,
        pageSize,
        totalCount,
        onPageChange: handlePageChange,
      }}
      labels={{
        welcome: t("welcome", { name: userName }),
        welcomeBack: t("welcomeBack"),
        pendingMessages: t("pendingMessages", { count: metrics.pendingMessages }),
        metrics: {
          totalStudents: t("metrics.totalStudents"),
          todaysClasses: t("metrics.todaysClasses"),
          pendingInvoices: t("metrics.pendingInvoices"),
          performanceAvg: t("metrics.performanceAvg"),
        },
        schedule: {
          title: t("schedule.title"),
          titleMobile: t("schedule.titleMobile"),
          filter: t("schedule.filter"),
          viewFullWeek: t("schedule.viewFullWeek"),
          viewAll: t("schedule.viewAll"),
          rowNumber: t("schedule.rowNumber"),
          classTime: t("schedule.classTime"),
          studentName: t("schedule.studentName"),
          teacherName: t("schedule.teacherName"),
          history: t("schedule.history"),
          status: t("schedule.status"),
          contact: t("schedule.contact"),
          classStatus: t("schedule.classStatus"),
          duration: t("schedule.duration", { minutes: "{minutes}" }),
          teacherLabel: t("schedule.teacherLabel", { name: "{name}" }),
          joinVideo: t("schedule.joinVideo"),
          noEntries: t("schedule.noEntries"),
        },
        bookingStatus: {
          confirmed: t("bookingStatus.confirmed"),
          rescheduled: t("bookingStatus.rescheduled"),
        },
        liveClassStatus: {
          starting_soon: t("liveClassStatus.startingSoon"),
          pending: t("liveClassStatus.pending"),
          scheduled: t("liveClassStatus.scheduled"),
        },
        progress: {
          title: t("progress.title"),
          subtitle: t("progress.subtitle"),
          completion: t("progress.completion", { percent: "{percent}" }),
          downloadReport: t("progress.downloadReport"),
        },
        workshop: {
          badge: t("workshop.badge"),
          learnMore: t("workshop.learnMore"),
        },
        support: {
          liveSupport: t("support.liveSupport"),
        },
      }}
      onFilter={handleFilter}
      onViewFullWeek={handleViewFullWeek}
      onViewAll={handleViewAll}
      onHistory={handleHistory}
      onJoinVideo={handleJoinVideo}
      onDownloadReport={handleDownloadReport}
      onLearnMore={handleLearnMore}
      onSupport={handleSupport}
    />
  );
}
