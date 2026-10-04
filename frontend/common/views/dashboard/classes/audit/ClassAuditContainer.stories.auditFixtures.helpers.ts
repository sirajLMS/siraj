import type { ClassStatusEventsQuery } from "@/frontend/common/graphql/generated/gql/graphql";

/** The shared instance id every mock of the audit story meta targets. */
export const STORY_INSTANCE_ID = "story-class-id";

export const mockAuditData = {
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

/** Status timeline shown on the payroll card beneath the snapshot. */
export const mockStatusEvents: ClassStatusEventsQuery = {
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
