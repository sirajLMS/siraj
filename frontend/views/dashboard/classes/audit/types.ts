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
