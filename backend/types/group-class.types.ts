import type { classCommunications, groupClassEnrollments, groupClasses } from "@/backend/db/schema";

export type GroupClassSelectType = typeof groupClasses.$inferSelect;
export type GroupClassInsertType = typeof groupClasses.$inferInsert;

export type GroupClassEnrollmentSelectType = typeof groupClassEnrollments.$inferSelect;
export type GroupClassEnrollmentInsertType = typeof groupClassEnrollments.$inferInsert;

export type ClassCommunicationSelectType = typeof classCommunications.$inferSelect;
export type ClassCommunicationInsertType = typeof classCommunications.$inferInsert;

export type GroupClassAuditReturnType = {
  id: string;
  className: string;
  courseCode: string;
  teacherName: string;
  originalDate: string | null;
  rescheduledDate: string | null;
  timeSlot: string;
  venue: string;
  status: string;
  auditRemark: string | null;
  auditLoggedAt: string;
  registeredStudentCount: number;
  totalStudentCount: number;
  students: GroupClassStudentReturnType[];
  meetingInfo: OnlineMeetingInfoReturnType;
  communications: CommunicationLogEntryReturnType[];
  adminNote: AdminNoteReturnType;
};

export type GroupClassStudentReturnType = {
  id: string;
  name: string;
  studentId: string;
  initials: string;
  attendanceStatus: string;
  avatarUrl: string | null;
};

export type OnlineMeetingInfoReturnType = {
  platform: string;
  zoomMeetingUrl: string | null;
  meetingId: string | null;
  joinUrl: string | null;
};

export type CommunicationLogEntryReturnType = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isDelivered: boolean | null;
  timestamp: string | null;
};

export type AdminNoteReturnType = {
  content: string;
  lastUpdated: string;
};
