import { useMediaQuery, useTheme } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import { useClassDetailsStore } from "@/frontend/stores/mockClassDetailsStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { logger } from "@/frontend/utils/logger";
import type { ClassInstance, ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";
import { ClassDetailsAdminView } from "./admin/ClassDetailsAdminView";
import { ClassDetailsTeacherView } from "./teacher/ClassDetailsTeacherView";

interface MockViewProps {
  readonly pageHeader: React.ReactNode;
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly dismissWarning: () => void;
  readonly timezoneLabels: { readonly title: string; readonly description: string };
}

function MockAdminViewWrapper({
  pageHeader,
  instance,
  isWarningDismissed,
  dismissWarning,
  timezoneLabels,
}: MockViewProps) {
  const t = useTranslations("dashboard.classDetails");

  const handleForceActivate = () => {
    logger.info("Admin force-activate:", instance.id);
  };
  const handleStop = () => {
    logger.info("Admin stop:", instance.id);
  };
  const handleGenerateLog = () => {
    logger.info("Admin generate log:", instance.id);
  };
  const handleDelete = () => {
    logger.warn("Admin delete instance:", instance.id);
  };

  return (
    <PageContainer>
      {pageHeader}
      <ClassDetailsAdminView
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={dismissWarning}
        onForceActivate={handleForceActivate}
        onStop={handleStop}
        onGenerateLog={handleGenerateLog}
        onDelete={handleDelete}
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
}

function MockTeacherViewWrapper({
  pageHeader,
  instance,
  isWarningDismissed,
  dismissWarning,
  timezoneLabels,
}: MockViewProps) {
  const t = useTranslations("dashboard.classDetails");

  const handleStop = () => {
    logger.info("Admin stop:", instance.id);
  };
  const handleDelete = () => {
    logger.warn("Admin delete instance:", instance.id);
  };
  const handleActivate = () => {
    logger.info("Teacher activate:", instance.id);
  };
  const handleInfoEdit = () => {
    logger.info("Teacher info/edit:", instance.id);
  };
  const handleViewProfile = () => {
    logger.info("View student profile:", instance.student?.id ?? "");
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
        onDismissWarning={dismissWarning}
        onActivate={handleActivate}
        onStop={handleStop}
        onInfoEdit={handleInfoEdit}
        onDelete={handleDelete}
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
}

function mapMockToReal(mock: ClassInstance): ClassInstanceDetail {
  return {
    __typename: "ClassInstanceDetail",
    id: mock.id,
    instanceId: mock.instanceId,
    courseName: mock.courseName,
    scheduledDate: mock.scheduledDate,
    startTime: mock.startTime,
    endTime: mock.endTime,
    durationMinutes: mock.durationMinutes,
    status: mock.status,
    remarks: mock.remarks,
    hasTimezoneMismatch: mock.hasTimezoneMismatch,
    studentTimezone: mock.studentTimezone,
    zoomMeetingUrl: "",
    student: {
      __typename: "ClassInstanceStudentInfo",
      id: mock.student.id,
      name: mock.student.name,
      grade: mock.student.grade,
      level: String(mock.student.level),
      avatarUrl: mock.student.avatarUrl,
    },
    teacher: {
      __typename: "ClassInstanceTeacherInfo",
      id: "teacher-id",
      name: mock.teacher.name,
      title: mock.teacher.title,
      avatarUrl: mock.teacher.avatarUrl,
    },
    performance: {
      __typename: "ClassInstancePerformance",
      engagementScore: 92,
      assessmentProgress: 14,
      assessmentTotal: 20,
      focusLevel: "High",
      sessionHealth: "Stable",
      latencyMs: mock.latencyMs,
      attendanceRate: mock.attendanceRate,
      avgGrade: mock.avgGrade,
      lastClassDaysAgo: mock.lastClassDaysAgo,
      heatmapData: [...mock.heatmapData],
    },
  };
}

export function MockClassDetailsContainer() {
  const t = useTranslations("dashboard.classDetails");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const permissions = useUserStore(state => state.permissions);
  const mockInstance = useClassDetailsStore(state => state.instance);
  const isWarningDismissed = useClassDetailsStore(state => state.isWarningDismissed);
  const dismissWarning = useClassDetailsStore(state => state.dismissWarning);

  const canOverride = permissions.includes(AppPermission.SessionOverrideActions);
  const canView = permissions.includes(AppPermission.SessionViewDetails);

  const instance = mapMockToReal(mockInstance);

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

  const timezoneLabels = {
    title: t("timezone.title"),
    description: t("timezone.description", { timezone: instance.studentTimezone ?? "" }),
  };

  if (canOverride) {
    return (
      <MockAdminViewWrapper
        pageHeader={pageHeader}
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        dismissWarning={dismissWarning}
        timezoneLabels={timezoneLabels}
      />
    );
  }

  if (canView) {
    return (
      <MockTeacherViewWrapper
        pageHeader={pageHeader}
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        dismissWarning={dismissWarning}
        timezoneLabels={timezoneLabels}
      />
    );
  }

  return null;
}

const meta: Meta<typeof MockClassDetailsContainer> = {
  title: "Views/dashboard/classes/details/ClassDetailsContainer",
  component: MockClassDetailsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockClassDetailsContainer>;

export const Default: Story = {
  args: {},
};
