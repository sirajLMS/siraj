"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  activateClassMutationDocument,
  classInstanceQueryDocument,
  deleteClassInstanceMutationDocument,
  forceActivateClassMutationDocument,
  stopClassMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import type { ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";
import { ClassDetailsAdminView } from "./admin/ClassDetailsAdminView";
import { ClassDetailsTeacherView } from "./teacher/ClassDetailsTeacherView";

interface AdminViewWrapperProps {
  readonly pageHeader: React.ReactNode;
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onDelete: () => void;
}

const AdminViewWrapper = ({
  pageHeader,
  instance,
  isWarningDismissed,
  onDismissWarning,
  onForceActivate,
  onStop,
  onDelete,
}: AdminViewWrapperProps) => {
  const t = useTranslations("dashboard.classDetails");

  const handleGenerateLog = () => {
    logger.info("Admin generate log:", instance.id);
  };

  const timezoneLabels = {
    title: t("timezone.title"),
    description: t("timezone.description", { timezone: instance.studentTimezone ?? "" }),
  };

  return (
    <PageContainer>
      {pageHeader}
      <ClassDetailsAdminView
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={onDismissWarning}
        onForceActivate={onForceActivate}
        onStop={onStop}
        onGenerateLog={handleGenerateLog}
        onDelete={onDelete}
        labels={{
          timezone: timezoneLabels,
          adminActions: {
            administrativeActions: t("adminActions.administrativeActions"),
            generateLog: t("adminActions.generateLog"),
          },
          classInfo: {
            liveInstance: t("classInfo.liveInstance"),
            activeConnection: t("classInfo.activeConnection"),
            student: t("classInfo.student"),
            moduleInstructor: t("classInfo.moduleInstructor"),
          },
          metadata: {
            metadata: t("metadata.metadata"),
            scheduledDate: t("metadata.scheduledDate"),
            duration: t("metadata.duration"),
            latency: t("metadata.latency"),
            authorization: t("metadata.authorization"),
            minutes: t("metadata.minutes"),
            optimal: t("metadata.optimal"),
          },
          performance: {
            livePerformanceOverview: t("performance.livePerformanceOverview"),
            last30Mins: t("performance.last30Mins"),
            engagementScore: t("performance.engagementScore"),
            assessmentProgress: t("performance.assessmentProgress"),
            focusLevel: t("performance.focusLevel"),
            sessionHealth: t("performance.sessionHealth"),
          },
          heatmap: {
            activityHeatmap: t("heatmap.activityHeatmap"),
            studentInput: t("heatmap.studentInput"),
            teacherResponse: t("heatmap.teacherResponse"),
          },
        }}
      />
    </PageContainer>
  );
};

interface TeacherViewWrapperProps {
  readonly pageHeader: React.ReactNode;
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onActivate: () => void;
  readonly onStop: () => void;
  readonly onDelete: () => void;
}

const TeacherViewWrapper = ({
  pageHeader,
  instance,
  isWarningDismissed,
  onDismissWarning,
  onActivate,
  onStop,
  onDelete,
}: TeacherViewWrapperProps) => {
  const t = useTranslations("dashboard.classDetails");

  const handleInfoEdit = () => {
    logger.info("Teacher info/edit:", instance.id);
  };
  const handleViewProfile = () => {
    logger.info("View student profile:", instance.student?.id ?? "");
  };

  const timezoneLabels = {
    title: t("timezone.title"),
    description: t("timezone.description", { timezone: instance.studentTimezone ?? "" }),
  };

  const statusLabels: Record<ClassInstanceStatus, string> = {
    active: t("status.active"),
    scheduled: t("status.scheduled"),
    pending: t("status.pending"),
    completed: t("status.completed"),
    cancelled: t("status.cancelled"),
  };

  return (
    <PageContainer>
      {pageHeader}
      <ClassDetailsTeacherView
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={onDismissWarning}
        onActivate={onActivate}
        onStop={onStop}
        onInfoEdit={handleInfoEdit}
        onDelete={onDelete}
        onViewProfile={handleViewProfile}
        labels={{
          timezone: timezoneLabels,
          instanceDetails: {
            classInstanceDetails: t("instanceDetails.classInstanceDetails"),
            studentName: t("instanceDetails.studentName"),
            courseModule: t("instanceDetails.courseModule"),
            startTime: t("instanceDetails.startTime"),
            endTime: t("instanceDetails.endTime"),
            duration: t("instanceDetails.duration"),
            status: t("instanceDetails.status"),
            minutes: t("metadata.minutes"),
            statusLabels,
          },
          remarks: {
            remarksTitle: t("remarks.remarksTitle"),
          },
          performance: {
            previousPerformanceOverview: t("performance.previousPerformanceOverview"),
            attendanceRate: t("performance.attendanceRate"),
            avgGrade: t("performance.avgGrade"),
            lastClass: t("performance.lastClass"),
            days: t("performance.days"),
          },
          actions: {
            actions: t("actions.actions"),
            activate: t("actions.activate"),
            stopPause: t("actions.stopPause"),
            infoEdit: t("actions.infoEdit"),
            delete: t("actions.delete"),
            contextualHelp: t("actions.contextualHelp"),
          },
          studentProfile: {
            studentLevel: t("studentProfile.studentLevel"),
            viewFullProfile: t("studentProfile.viewFullProfile"),
          },
        }}
      />
    </PageContainer>
  );
};

export function ClassDetailsContainer() {
  const t = useTranslations("dashboard.classDetails");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const locale = useLocale();

  const { id } = useParams() as { id: string };
  const hasPermission = useUserStore(state => state.hasPermission);

  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id },
  });

  const [activateClass] = useMutation(activateClassMutationDocument);
  const [forceActivateClass] = useMutation(forceActivateClassMutationDocument);
  const [stopClass] = useMutation(stopClassMutationDocument);
  const [deleteClass] = useMutation(deleteClassInstanceMutationDocument);

  const canOverride = hasPermission(AppPermission.SessionOverrideActions);
  const canView = hasPermission(AppPermission.SessionViewDetails);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.classInstance) {
    logger.error("Error fetching class details:", error);
    return null;
  }

  const instance = data.classInstance;

  const handleForceActivate = async () => {
    try {
      await forceActivateClass({ variables: { classInstanceId: id } });
      logger.info("Admin force-activated session:", id);
    } catch (err) {
      logger.error("Error in forceActivateClass:", err);
    }
  };

  const handleStop = async () => {
    try {
      await stopClass({ variables: { classInstanceId: id } });
      logger.info("Stopped session:", id);
    } catch (err) {
      logger.error("Error in stopClass:", err);
    }
  };

  const handleActivate = async () => {
    try {
      await activateClass({ variables: { classInstanceId: id } });
      logger.info("Teacher activated session:", id);
    } catch (err) {
      logger.error("Error in activateClass:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClass({ variables: { classInstanceId: id } });
      logger.warn("Deleted class instance:", id);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      logger.error("Error in deleteClass:", err);
    }
  };

  const pageHeader = (
    <PageHeader
      title={instance.courseName ?? ""}
      subtitle={canOverride ? t("pageSubtitleAdmin") : t("pageSubtitleTeacher")}
      titleVariant={isMobile ? "headlineMd" : "headlineLg"}
      breadcrumbs={
        isMobile
          ? undefined
          : [
              { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
              { label: t("breadcrumbs.classes"), href: `/classes/${instance.id}` },
              { label: instance.courseName ?? "", current: true },
            ]
      }
    />
  );

  if (canOverride) {
    return (
      <AdminViewWrapper
        pageHeader={pageHeader}
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={() => setIsWarningDismissed(true)}
        onForceActivate={handleForceActivate}
        onStop={handleStop}
        onDelete={handleDelete}
      />
    );
  }

  if (canView) {
    return (
      <TeacherViewWrapper
        pageHeader={pageHeader}
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={() => setIsWarningDismissed(true)}
        onActivate={handleActivate}
        onStop={handleStop}
        onDelete={handleDelete}
      />
    );
  }

  return null;
}
