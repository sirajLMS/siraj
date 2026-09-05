import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import { type ReactNode, useEffect, useMemo } from "react";
import {
  AppPermission,
  CalculationStatus,
  ClassExecutionState,
  type ClassInstanceQuery,
  ClassOutcome,
  type ClassStatusEventsQuery,
  ClassType,
  CurrencyCode,
  RateSource,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  classInstanceQueryDocument,
  classStatusEventsQueryDocument,
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useClassAuditStore as classAuditStore } from "@/frontend/common/stores/classAuditStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { seedPermissions } from "@/frontend/common/stories";
import { ClassAuditContainer } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer";
import { IanaTimezone } from "@/shared/constants";

const mockAuditData = {
  groupClassAudit: {
    id: "1",
    className: "Quran Recitation - Advanced",
    courseCode: "REGULAR",
    teacherName: "Ustadh Ahmad",
    originalDate: "2026-06-20T10:00:00Z",
    rescheduledDate: "2026-06-27T10:00:00Z",
    timeSlot: "10:00 AM - 11:00 AM",
    venue: "Online",
    status: "regular_rescheduled",
    auditRemark: "Class rescheduled due to teacher availability",
    outcome: "TAKEN",
    isFrozen: false,
    auditLoggedAt: "2026-06-20T08:00:00Z",
    registeredStudentCount: 3,
    totalStudentCount: 3,
    students: [
      {
        id: "s1",
        name: "Fatima Al-Rashid",
        studentId: "STU-001",
        initials: "FA",
        attendanceStatus: "present",
        avatarUrl: null,
      },
      {
        id: "s2",
        name: "Omar Hassan",
        studentId: "STU-002",
        initials: "OH",
        attendanceStatus: "pending",
        avatarUrl: null,
      },
      {
        id: "s3",
        name: "Aisha Mahmoud",
        studentId: "STU-003",
        initials: "AM",
        attendanceStatus: "absent",
        avatarUrl: null,
      },
    ],
    meetingInfo: {
      platform: "zoom",
      meetingId: "123456789",
      joinUrl: "https://zoom.us/j/123456789",
      logoUrl: null,
      providerName: "Zoom",
      source: "AUTO_GENERATED",
    },
    communications: [
      {
        id: "c1",
        type: "email",
        title: "Class Rescheduled",
        description: "Notification sent to parent",
        isActive: true,
        isDelivered: true,
        timestamp: "2026-06-20T09:00:00Z",
      },
      {
        id: "c2",
        type: "sms",
        title: "Reminder",
        description: "SMS reminder for class",
        isActive: true,
        isDelivered: false,
        timestamp: "2026-06-27T08:00:00Z",
      },
    ],
    adminNote: {
      content: "Student needs extra attention on Tajweed rules. Parent requested follow-up.",
      lastUpdated: "2026-06-25T14:30:00Z",
    },
  },
};

/** Payroll snapshot for the drilled-into class instance (drives the payroll card and the override dialog row). */
const mockPayrollInstance: ClassInstanceQuery = {
  classInstance: {
    id: "story-class-id",
    courseName: "Quran Recitation - Advanced",
    classType: ClassType.Regular,
    instanceId: "story-class-id",
    scheduledDate: "2026-06-27",
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: ClassExecutionState.Completed,
    remarks: null,
    hasTimezoneMismatch: false,
    studentTimezone: IanaTimezone.Asia_Riyadh,
    teacherTimezone: IanaTimezone.Asia_Riyadh,
    recurringScheduleId: null,
    effectiveMeeting: null,
    payrollCredited: false,
    calculationStatus: CalculationStatus.Calculated,
    teacherPaidAmount: "180.00",
    teacherPaidCurrency: CurrencyCode.Sar,
    calculatedDuration: 62,
    isPartialPercentage: null,
    payrollNote:
      "Session ran two minutes over the scheduled hour; billed in full under the standing rate agreement with the teacher.",
    payrollCalculatedAt: "2026-06-27T11:05:00.000Z",
    isRescheduled: true,
    isFrozen: false,
    executionState: ClassExecutionState.Completed,
    outcome: ClassOutcome.Taken,
    avatarUrl: null,
    subjectId: "sub-1",
    subjectName: "Quran Recitation",
    subjectAvatarUrl: null,
    rateAmount: "180.00",
    rateCurrency: CurrencyCode.Sar,
    isRateOverridden: false,
    rateSource: RateSource.Teacher,
    student: { id: "s1", name: "Fatima Al-Rashid", grade: "Grade 8", level: "Advanced", avatarUrl: null },
    teacher: { id: "t1", name: "Ustadh Ahmad", title: "Quran Teacher", avatarUrl: null },
    performance: null,
  },
};

/** Status timeline shown on the payroll card beneath the snapshot. */
const mockStatusEvents: ClassStatusEventsQuery = {
  classStatusEvents: [
    {
      id: "ev-1",
      eventType: "SCHEDULED",
      description: "Session scheduled for 2026-06-20 10:00",
      createdAt: "2026-06-18T09:00:00.000Z",
    },
    {
      id: "ev-2",
      eventType: "RESCHEDULED",
      description: "Moved to 2026-06-27 10:00 due to teacher availability",
      createdAt: "2026-06-20T08:00:00.000Z",
    },
    {
      id: "ev-3",
      eventType: "COMPLETED",
      description: "Session ended after 62 minutes",
      createdAt: "2026-06-27T11:05:00.000Z",
    },
  ],
};

/** Payroll permissions unlock the payroll card and the override dialog on the audit page. */
const PAYROLL_PERMISSIONS = [AppPermission.AccountingPayrollView, AppPermission.AccountingPayrollManage];

/**
 * Seeds the payroll permissions at render time (the deep link and the
 * payroll-gated queries read them during their first render and never
 * re-evaluate the permission selector from store notifications) and then keeps
 * them pinned: the preview-level wrapper rewrites the user store in its own
 * mount effect with a generic permission list, so a synchronous store
 * subscription re-seeds the payroll set the moment any overwrite lands. The
 * audit dialog state resets on unmount so it never leaks into a sibling story.
 */
function PayrollPermissionsResync({ children }: Readonly<{ children: ReactNode }>) {
  seedPermissions(PAYROLL_PERMISSIONS);
  useEffect(() => {
    const unsubscribe = useUserStore.subscribe(state => {
      if (!state.hasPermission(AppPermission.AccountingPayrollManage)) {
        seedPermissions(PAYROLL_PERMISSIONS);
      }
    });
    return () => {
      unsubscribe();
      classAuditStore.getState().reset();
    };
  }, []);
  return <NotificationsProvider>{children}</NotificationsProvider>;
}

/** The shared instance id every mock of this meta targets. */
const STORY_INSTANCE_ID = "story-class-id";

/**
 * Apollo cache pre-warmed with the payroll snapshot and the status timeline:
 * the mock link serves the same payloads, but a pre-populated cache renders the
 * payroll card and the override dialog summary from cache-first reads even if
 * a dev-server hot reload or the double-effect pass under StrictMode drops an
 * in-flight mock fetch. Built per mount so stories never share cache state.
 */
function buildSeededCache(): InMemoryCache {
  const cache = new InMemoryCache();
  cache.writeQuery({
    query: classInstanceQueryDocument,
    variables: { id: STORY_INSTANCE_ID },
    data: mockPayrollInstance,
  });
  cache.writeQuery({
    query: classStatusEventsQueryDocument,
    variables: { classInstanceId: STORY_INSTANCE_ID },
    data: mockStatusEvents,
  });
  return cache;
}

function MockedAuditProviders({ children }: Readonly<{ children: ReactNode }>) {
  const cache = useMemo(() => buildSeededCache(), []);
  return (
    <MockedProvider
      cache={cache}
      mocks={[
        {
          request: {
            query: groupClassAuditQueryDocument,
            variables: { classInstanceId: STORY_INSTANCE_ID },
          },
          result: { data: mockAuditData },
        },
        {
          request: {
            query: resendClassNotificationsMutationDocument,
            variables: { classInstanceId: STORY_INSTANCE_ID },
          },
          result: { data: { resendClassNotifications: { id: STORY_INSTANCE_ID, success: true } } },
        },
        {
          request: {
            query: updateClassAdminNoteMutationDocument,
            variables: { classInstanceId: STORY_INSTANCE_ID, content: "Updated note" },
          },
          result: { data: { updateClassAdminNote: mockAuditData.groupClassAudit } },
        },
        {
          request: {
            query: classInstanceQueryDocument,
            variables: { id: STORY_INSTANCE_ID },
          },
          result: { data: mockPayrollInstance },
          maxUsageCount: Number.POSITIVE_INFINITY,
        },
        {
          request: {
            query: classStatusEventsQueryDocument,
            variables: { classInstanceId: STORY_INSTANCE_ID },
          },
          result: { data: mockStatusEvents },
          maxUsageCount: Number.POSITIVE_INFINITY,
        },
      ]}
    >
      {children}
    </MockedProvider>
  );
}

const meta: Meta<typeof ClassAuditContainer> = {
  title: "Views/dashboard/classes/audit/ClassAuditContainer",
  component: ClassAuditContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <MockedAuditProviders>
        <Story />
      </MockedAuditProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClassAuditContainer>;

export const Default: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/classes/story-class-id/audit",
        segments: [["id", "story-class-id"]],
      },
    },
  },
  args: {},
};

/**
 * Mirrors the state a payroll manager lands in after following the reports
 * grid's "open audit page" action: the audit view behind it and the payroll
 * override dialog already open over the instance snapshot.
 */
export const OverrideDialogFromDeepLink: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/classes/story-class-id/audit",
        segments: [["id", "story-class-id"]],
        query: { openOverride: "1" },
      },
    },
  },
  decorators: [
    Story => (
      <PayrollPermissionsResync>
        <Story />
      </PayrollPermissionsResync>
    ),
  ],
};
