import type {
  AdminNoteInfo,
  CommunicationLogEntry,
  GroupClassAudit,
  GroupClassStudent,
  OnlineMeetingInfo,
} from "@/frontend/graphql/generated/gql/graphql-types";

export type {
  AdminNoteInfo as AdminNoteData,
  CommunicationLogEntry as CommunicationLogEntryData,
  GroupClassAudit as ClassAuditData,
  GroupClassStudent as RegisteredStudent,
  OnlineMeetingInfo as MeetingInfo,
};

export type AttendanceStatus = "pending" | "present" | "absent";

export type CommunicationType = "email" | "sms";
