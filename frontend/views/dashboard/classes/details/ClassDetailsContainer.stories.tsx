import { useMediaQuery, useTheme } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PageContainer } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import { useClassDetailsStore } from "@/frontend/stores/mockClassDetailsStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { logger } from "@/frontend/utils/logger";
import type { ClassInstance } from "@/frontend/views/dashboard/types/dashboard";
import { ClassDetailsAdminView } from "./admin/ClassDetailsAdminView";
import { ClassDetailsHeader } from "./ClassDetailsHeader";
import { ClassDetailsTeacherView } from "./teacher/ClassDetailsTeacherView";
import { useAdminViewLabels, useTeacherViewLabels } from "./useClassDetailsLabels";

interface MockViewProps {
  readonly pageHeader: React.ReactNode;
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly dismissWarning: () => void;
}

function MockAdminViewWrapper({ pageHeader, instance, isWarningDismissed, dismissWarning }: MockViewProps) {
  const labels = useAdminViewLabels(instance.studentTimezone ?? "");

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
        labels={labels}
      />
    </PageContainer>
  );
}

function MockTeacherViewWrapper({ pageHeader, instance, isWarningDismissed, dismissWarning }: MockViewProps) {
  const labels = useTeacherViewLabels(instance.studentTimezone ?? "");

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
        labels={labels}
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
    executionState: "NOT_ACTIVATED",
    isRescheduled: false,
    outcome: "PENDING",
    payrollCredited: false,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const permissions = useUserStore(state => state.permissions);
  const mockInstance = useClassDetailsStore(state => state.instance);
  const isWarningDismissed = useClassDetailsStore(state => state.isWarningDismissed);
  const dismissWarning = useClassDetailsStore(state => state.dismissWarning);

  const canOverride = permissions.includes(AppPermission.SessionOverrideActions);
  const canView = permissions.includes(AppPermission.SessionViewDetails);

  const instance = mapMockToReal(mockInstance);

  const pageHeader = <ClassDetailsHeader instance={instance} canOverride={canOverride} isMobile={isMobile} />;

  if (canOverride) {
    return (
      <MockAdminViewWrapper
        pageHeader={pageHeader}
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        dismissWarning={dismissWarning}
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
