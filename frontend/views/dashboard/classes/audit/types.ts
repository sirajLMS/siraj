export type {
  AdminNoteInfo as AdminNoteData,
  CommunicationLogEntry as CommunicationLogEntryData,
  GroupClassAudit as ClassAuditData,
  GroupClassStudent as RegisteredStudent,
  OnlineMeetingInfo as MeetingInfo,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export type AttendanceStatus = "pending" | "present" | "absent";

export type CommunicationType = "email" | "sms";
