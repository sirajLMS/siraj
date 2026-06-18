"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useTeacherDashboardActiveStore } from "@/frontend/stores/mockTeacherDashboardActiveStore";
import { useTeacherDashboardStore } from "@/frontend/stores/mockTeacherDashboardStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { logger } from "@/frontend/utils/logger";
import { TeacherDashboardActiveView } from "./TeacherDashboardActiveView";
import { TeacherDashboardView } from "./TeacherDashboardView";
import { buildTeacherDashboardLabels } from "./utils/buildTeacherDashboardLabels";
import { resolveTeacherDashboardMode, shouldRenderTeacherDashboard } from "./utils/teacherDashboardMode";

export function TeacherDashboardContainer() {
  const t = useTranslations("dashboard.teacherDashboard");
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const permissions = useUserStore(state => state.permissions);
  const userName = useUserStore(state => state.name);

  const standardMetrics = useTeacherDashboardStore(state => state.metrics);
  const standardRows = useTeacherDashboardStore(state => state.scheduleRows);
  const missedAlert = useTeacherDashboardStore(state => state.missedAlert);
  const scheduleDateLabel = useTeacherDashboardStore(state => state.scheduleDateLabel);
  const totalScheduledToday = useTeacherDashboardStore(state => state.totalScheduledToday);

  const activeMetrics = useTeacherDashboardActiveStore(state => state.metrics);
  const activeRows = useTeacherDashboardActiveStore(state => state.scheduleRows);
  const progressFeed = useTeacherDashboardActiveStore(state => state.progressFeed);
  const welcomeDateSummary = useTeacherDashboardActiveStore(state => state.welcomeDateSummary);
  const sessionsScheduledToday = useTeacherDashboardActiveStore(state => state.sessionsScheduledToday);
  const activateSession = useTeacherDashboardActiveStore(state => state.activateSession);

  if (!shouldRenderTeacherDashboard(permissions, modeParam)) {
    return null;
  }

  const mode = resolveTeacherDashboardMode(permissions, modeParam);
  const labels = buildTeacherDashboardLabels(t);
  const canControl = permissions.includes(AppPermission.SessionActivateClass);

  if (mode === "active" && canControl) {
    return (
      <TeacherDashboardActiveView
        userName={userName}
        metrics={activeMetrics}
        scheduleRows={activeRows}
        progressFeed={progressFeed}
        welcomeDateSummary={welcomeDateSummary}
        sessionsScheduledToday={sessionsScheduledToday}
        labels={labels}
        onActivate={id => {
          logger.info("Teacher active dashboard activate clicked", { id });
          activateSession(id);
        }}
        onNewSession={() => {
          logger.info("Teacher active dashboard new session clicked");
        }}
      />
    );
  }

  return (
    <TeacherDashboardView
      metrics={standardMetrics}
      scheduleRows={standardRows}
      missedAlert={missedAlert}
      scheduleDateLabel={scheduleDateLabel}
      totalScheduledToday={totalScheduledToday}
      labels={labels}
      canActivate={false}
      canManualEntry={false}
      canPrintSchedule={true}
      onPrintSchedule={() => {
        logger.info("Teacher dashboard print schedule clicked");
      }}
      onManualEntry={() => {
        logger.info("Teacher dashboard manual entry clicked");
      }}
      onJoinVideo={id => {
        logger.info("Teacher dashboard join video clicked", { id });
      }}
      onDownloadHandbook={() => {
        logger.info("Teacher dashboard download handbook clicked");
      }}
      onContactCoordinator={() => {
        logger.info("Teacher dashboard contact coordinator clicked");
      }}
      onSupport={() => {
        logger.info("Teacher dashboard support clicked");
      }}
    />
  );
}
