import type { classCommunications, groupClassEnrollments, groupClasses } from "@/backend/db/schema";
import type { GroupClassAttendanceStatus } from "@/backend/enum";
import type { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import type { LocalizedString } from "@/shared/types";
export type GroupClassSelectType = typeof groupClasses.$inferSelect;
export type GroupClassInsertType = typeof groupClasses.$inferInsert;
export type GroupClassCreateInput = Omit<GroupClassInsertType, "id" | "createdAt" | "updatedAt">;

export type GroupClassEnrollmentSelectType = typeof groupClassEnrollments.$inferSelect;
export type GroupClassEnrollmentInsertType = typeof groupClassEnrollments.$inferInsert;

export type GroupClassEnrollmentCreateInput = Omit<GroupClassEnrollmentInsertType, "id" | "createdAt" | "updatedAt">;

export type GroupClassEnrollmentWithStudent = GroupClassEnrollmentSelectType & {
  readonly studentName: string;
  readonly studentAvatarUrl: string | null;
};

export type ClassCommunicationSelectType = typeof classCommunications.$inferSelect;
export type ClassCommunicationInsertType = typeof classCommunications.$inferInsert;
export type ClassCommunicationCreateInput = Omit<ClassCommunicationInsertType, "id" | "createdAt">;

export type GroupClassAuditReturnType = {
  id: string;
  className: string;
  courseCode: string;
  teacherName: string;
  originalDate: string | null;
  rescheduledDate: string | null;
  timeSlot: string;
  venue: string;
  status: ClassExecutionState;
  outcome: ClassOutcome;
  isFrozen: boolean;
  auditRemark: string | null;
  auditLoggedAt: string;
  registeredStudentCount: number;
  totalStudentCount: number;
  students: GroupClassStudentReturnType[];
  meetingInfo: GroupClassOnlineMeetingInfoReturnType;
  communications: GroupClassCommunicationLogEntryReturnType[];
  adminNote: GroupClassAdminNoteReturnType;
  /**
   * True when the audit payload was derived from a standalone 1-on-1 class
   * instance (no `group_classes` row); group-only affordances such as the
   * notification resend and the enrolled-students export do not apply.
   */
  isOneOnOne: boolean;
};

export type GroupClassStudentReturnType = {
  id: string;
  name: string;
  studentId: string;
  initials: string;
  attendanceStatus: GroupClassAttendanceStatus;
  avatarUrl: string | null;
};

export type GroupClassOnlineMeetingInfoReturnType = {
  platform: string;
  meetingId: string | null;
  joinUrl: string | null;
  logoUrl?: string | null;
  providerName?: LocalizedString | null;
  source?: string | null;
};

export type GroupClassCommunicationLogEntryReturnType = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isDelivered: boolean | null;
  timestamp: string | null;
};

export type GroupClassAdminNoteReturnType = {
  content: string;
  lastUpdated: string;
};
