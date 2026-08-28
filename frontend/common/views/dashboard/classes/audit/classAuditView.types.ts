import type { GroupClassAuditQuery_groupClassAudit } from "@/frontend/common/graphql/generated/gql/graphql";

export interface MeetingInfoLabels {
  readonly title: string;
  readonly joinMeeting: string;
  readonly capacityBadge: string;
  readonly capacity: string;
  readonly meetingIdLabel: string;
  readonly online: string;
  readonly meetingIdNA: string;
}

export interface CommunicationLogLabels {
  readonly title: string;
  readonly resendNotifications: string;
}

export interface AdminNoteLabels {
  readonly title: string;
  readonly titleMobile: string;
  readonly lastUpdated: string;
  readonly update: string;
  readonly edit: string;
}

export interface AdminNoteDialogLabels {
  readonly title: string;
  readonly content: string;
  readonly cancel: string;
  readonly save: string;
}

export interface RegisteredStudentsLabels {
  readonly title: string;
  readonly exportList: string;
  readonly studentName: string;
  readonly idNumber: string;
  readonly attendanceStatus: string;
  readonly actions: string;
  readonly student: string;
  readonly status: string;
  readonly viewAll: string;
  readonly pending: string;
  readonly present: string;
  readonly absent: string;
  readonly noEntries: string;
  readonly viewStudentAriaLabel: (name: string) => string;
}

export interface ClassAuditLabels {
  readonly breadcrumbs: {
    readonly dashboard: string;
    readonly schedules: string;
    readonly current: string;
  };
  readonly pageTitle: string;
  readonly mobileTitle: string;
  readonly generateReport: string;
  readonly editClass: string;
  readonly courseCode: string;
  readonly teacher: string;
  readonly originalDate: string;
  readonly rescheduledDate: string;
  readonly timeSlot: string;
  readonly venue: string;
  readonly auditTrailTitle: string;
  readonly statusRescheduled: string;
  readonly classDetails: string;
  readonly registeredStudents: RegisteredStudentsLabels;
  readonly meetingInfo: MeetingInfoLabels;
  readonly communicationLog: CommunicationLogLabels;
  readonly adminNote: AdminNoteLabels;
  readonly adminNoteDialog: AdminNoteDialogLabels;
}

export interface ClassAuditViewProps {
  readonly audit: NonNullable<GroupClassAuditQuery_groupClassAudit>;
  readonly labels: ClassAuditLabels;
  readonly onGenerateReport: () => void;
  readonly onEditClass: () => void;
  readonly onExportStudents: () => void;
  readonly onViewStudent: (id: string) => void;
  readonly onResendNotifications: () => void;
  readonly onUpdateAdminNote: () => void;
  readonly onEditAdminNote: () => void;
  readonly isResending: boolean;
}

export interface ClassAuditDetailsLabels {
  readonly courseCode: string;
  readonly teacher: string;
  readonly originalDate: string;
  readonly rescheduledDate: string;
  readonly timeSlot: string;
  readonly venue: string;
  readonly auditTrailTitle: string;
  readonly statusRescheduled: string;
  readonly classDetails: string;
}
