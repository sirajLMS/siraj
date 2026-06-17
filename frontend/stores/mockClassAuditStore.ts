import { create } from "zustand";

export type ClassAuditStatus = "regular_rescheduled";

export type AttendanceStatus = "pending" | "present" | "absent";

export type CommunicationType = "email" | "sms";

export interface RegisteredStudent {
  readonly id: string;
  readonly name: string;
  readonly studentId: string;
  readonly initials: string;
  readonly attendanceStatus: AttendanceStatus;
  readonly avatarUrl?: string;
}

export interface VenueInfo {
  readonly name: string;
  readonly floor: string;
  readonly hall: string;
  readonly capacity: number;
  readonly features: string;
}

export interface CommunicationLogEntry {
  readonly id: string;
  readonly type: CommunicationType;
  readonly title: string;
  readonly description: string;
  readonly timestamp?: string;
  readonly isActive: boolean;
  readonly isDelivered?: boolean;
}

export interface AdminNote {
  readonly content: string;
  readonly lastUpdated: string;
}

export interface ClassAuditData {
  readonly id: string;
  readonly className: string;
  readonly courseCode: string;
  readonly teacherName: string;
  readonly originalDate: string;
  readonly rescheduledDate: string;
  readonly timeSlot: string;
  readonly venue: string;
  readonly status: ClassAuditStatus;
  readonly auditRemark: string;
  readonly auditLoggedAt: string;
  readonly registeredStudentCount: number;
  readonly totalStudentCount: number;
  readonly students: readonly RegisteredStudent[];
  readonly venueInfo: VenueInfo;
  readonly communications: readonly CommunicationLogEntry[];
  readonly adminNote: AdminNote;
}

interface ClassAuditState {
  readonly audit: ClassAuditData;
  resendNotifications: () => void;
  updateAdminNote: () => void;
}

const MOCK_AUDIT: ClassAuditData = {
  id: "cls-9921",
  className: "Advanced Mathematics - Section B",
  courseCode: "MATH-402-B",
  teacherName: "Dr. Sarah Al-Farsi",
  originalDate: "2023-10-24",
  rescheduledDate: "2023-10-26",
  timeSlot: "10:00 AM - 11:30 AM",
  venue: "Lecture Hall 4 / Hybrid",
  status: "regular_rescheduled",
  auditRemark:
    "Teacher has informed in advance for the leave. Class has been rescheduled from [2023-10-24] to [2023-10-26].",
  auditLoggedAt: "Logged by System on 2023-10-22 at 09:15 AM",
  registeredStudentCount: 32,
  totalStudentCount: 42,
  students: [
    {
      id: "s1",
      name: "John Doe",
      studentId: "STU-88291",
      initials: "JD",
      attendanceStatus: "pending",
      avatarUrl: "/demo/avatars/01.png",
    },
    {
      id: "s2",
      name: "Ali Smith",
      studentId: "STU-88245",
      initials: "AS",
      attendanceStatus: "pending",
    },
  ],
  venueInfo: {
    name: "Engineering Wing",
    floor: "Floor 2",
    hall: "Hall 4A",
    capacity: 45,
    features: "Smart Board & AV Enabled",
  },
  communications: [
    {
      id: "c1",
      type: "email",
      title: "Email Notification Sent",
      description: "Sent to 32 students regarding rescheduling.",
      timestamp: "2023-10-22 | 09:30 AM",
      isActive: true,
      isDelivered: true,
    },
    {
      id: "c2",
      type: "sms",
      title: "SMS Alert (Optional)",
      description: "Not triggered for this rescheduling event.",
      isActive: false,
    },
  ],
  adminNote: {
    content:
      "This class was moved to Thursday to accommodate the teacher's professional development leave. Room availability has been verified for the new slot.",
    lastUpdated: "Today, 2:15 PM",
  },
};

export const useClassAuditStore = create<ClassAuditState>(() => ({
  audit: MOCK_AUDIT,

  resendNotifications: () => {
    // Resend notifications logic in future
  },

  updateAdminNote: () => {
    // Update admin note logic in future
  },
}));
