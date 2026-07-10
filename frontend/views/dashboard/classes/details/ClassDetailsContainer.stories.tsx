import { useMediaQuery, useTheme } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { create } from "zustand";
import { PageContainer } from "@/frontend/components/ui";
import {
  AppPermission,
  ClassExecutionState,
  type ClassInstanceDetail,
  ClassOutcome,
  ClassType,
  IanaTimezone,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ClassDetailsAdminView } from "@/frontend/views/dashboard/classes/details/admin/ClassDetailsAdminView";
import { ClassDetailsHeader } from "@/frontend/views/dashboard/classes/details/ClassDetailsHeader";
import { ClassDetailsTeacherView } from "@/frontend/views/dashboard/classes/details/teacher/ClassDetailsTeacherView";
import {
  useAdminViewLabels,
  useTeacherViewLabels,
} from "@/frontend/views/dashboard/classes/details/useClassDetailsLabels";

interface MockClassDetailsState {
  instance: ClassInstanceDetail;
  isWarningDismissed: boolean;
  dismissWarning: () => void;
}

const mockInstance: ClassInstanceDetail = {
  id: "cls-9921",
  instanceId: "SRJ-449-AA",
  courseName: "Advanced Arabic Grammar",
  classType: ClassType.Regular,
  scheduledDate: "Oct 24, 2023",
  startTime: "24 Oct 2023, 09:00 AM",
  endTime: "24 Oct 2023, 10:30 AM",
  durationMinutes: 90,
  status: ClassExecutionState.NotActivated,
  remarks:
    "Student requested focus on Surah .. verses 120-140. Please ensure high-quality audio recording for parent review.",
  hasTimezoneMismatch: true,
  studentTimezone: IanaTimezone.AfricaCairo,
  teacherTimezone: null,
  meetingJoinUrl: "",
  effectiveMeeting: null,
  recurringScheduleId: null,
  executionState: ClassExecutionState.NotActivated,
  isRescheduled: false,
  outcome: ClassOutcome.Pending,
  payrollCredited: false,
  avatarUrl: null,
  student: {
    id: "88290",
    name: "Ahmed Omar",
    grade: "Grade 12",
    level: "4",
    avatarUrl: "/demo/avatars/01.png",
  },
  teacher: {
    id: "teacher-id",
    name: "Dr. Ali",
    title: "Senior Linguist • PH.D",
    avatarUrl: "/demo/avatars/04.png",
  },
  performance: {
    id: "perf-1",
    engagementScore: 92,
    assessmentProgress: 14,
    assessmentTotal: 20,
    focusLevel: "High",
    sessionHealth: "Stable",
    latencyMs: 14,
    authorizationLabel: "OAuth 2.0 SSL",
    attendanceRate: 94,
    avgGrade: "A-",
    lastClassDaysAgo: 3,
    heatmapData: [40, 60, 30, 80, 55, 45, 90, 70, 40, 60, 35, 85, 50, 40, 95, 75, 40, 60, 20, 80],
  },
};

const useMockClassDetailsStore = create<MockClassDetailsState>(set => ({
  instance: mockInstance,
  isWarningDismissed: false,
  dismissWarning: () => {
    set({ isWarningDismissed: true });
  },
}));

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
        formattedScheduledDate={instance.scheduledDate ?? ""}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={dismissWarning}
        onForceActivate={handleForceActivate}
        onStop={handleStop}
        onGenerateLog={handleGenerateLog}
        onReschedule={() => logger.info("Reschedule clicked")}
        onDelete={handleDelete}
        labels={labels}
        onStart={() => logger.info("Start clicked")}
        onAbsent={() => logger.info("Absent clicked")}
        onLeave={reason => logger.info("Leave clicked with reason:", reason)}
        onReset={() => logger.info("Reset clicked")}
        isStarting={false}
        isMarkingAbsent={false}
        isProcessingLeave={false}
        isResetting={false}
        error={null}
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

  return (
    <PageContainer>
      {pageHeader}
      <ClassDetailsTeacherView
        instance={instance}
        viewMode="teacher"
        formattedStartTime={instance.startTime ?? ""}
        formattedEndTime={instance.endTime ?? ""}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={dismissWarning}
        onActivate={handleActivate}
        onStop={handleStop}
        onInfoEdit={handleInfoEdit}
        onDelete={handleDelete}
        labels={labels}
        onStart={() => logger.info("Start clicked")}
        onAbsent={() => logger.info("Absent clicked")}
        onLeave={reason => logger.info("Leave clicked with reason:", reason)}
        onReset={() => logger.info("Reset clicked")}
        isStarting={false}
        isMarkingAbsent={false}
        isProcessingLeave={false}
        isResetting={false}
        error={null}
      />
    </PageContainer>
  );
}

export function MockClassDetailsContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const permissions = useUserStore(state => state.permissions);
  const mockInstance = useMockClassDetailsStore(state => state.instance);
  const isWarningDismissed = useMockClassDetailsStore(state => state.isWarningDismissed);
  const dismissWarning = useMockClassDetailsStore(state => state.dismissWarning);

  const canOverride = permissions.includes(AppPermission.SessionOverrideActions);
  const canView = permissions.includes(AppPermission.SessionViewDetails);

  const instance = mockInstance;

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

export const ForceActivateEnabled: Story = {
  args: {},
};

export const ForceActivateDisabled: Story = {
  args: {},
};
