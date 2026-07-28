import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { ClassAuditContainer } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer";

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

const meta: Meta<typeof ClassAuditContainer> = {
  title: "Views/dashboard/classes/audit/ClassAuditContainer",
  component: ClassAuditContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: groupClassAuditQueryDocument,
              variables: { classInstanceId: "story-class-id" },
            },
            result: { data: mockAuditData },
          },
          {
            request: {
              query: resendClassNotificationsMutationDocument,
              variables: { classInstanceId: "story-class-id" },
            },
            result: { data: { resendClassNotifications: { id: "story-class-id", success: true } } },
          },
          {
            request: {
              query: updateClassAdminNoteMutationDocument,
              variables: { classInstanceId: "story-class-id", content: "Updated note" },
            },
            result: { data: { updateClassAdminNote: mockAuditData.groupClassAudit } },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClassAuditContainer>;

export const Default: Story = {
  args: {},
};
