import type { GroupClassAudit } from "@/frontend/graphql/generated/gql/graphql-types";

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
  readonly registeredStudents: {
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
  };
  readonly meetingInfo: {
    readonly title: string;
    readonly joinMeeting: string;
    readonly capacityBadge: string;
    readonly capacity: string;
    readonly meetingIdLabel: string;
    readonly online: string;
    readonly meetingIdNA: string;
  };
  readonly communicationLog: {
    readonly title: string;
    readonly resendNotifications: string;
  };
  readonly adminNote: {
    readonly title: string;
    readonly titleMobile: string;
    readonly lastUpdated: string;
    readonly update: string;
    readonly edit: string;
  };
}

export interface ClassAuditViewProps {
  readonly audit: NonNullable<GroupClassAudit>;
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
