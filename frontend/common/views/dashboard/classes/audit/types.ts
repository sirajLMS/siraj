export type {
  GroupClassAuditQuery_groupClassAudit as ClassAuditData,
  GroupClassAuditQuery_groupClassAudit_adminNote as AdminNoteData,
  GroupClassAuditQuery_groupClassAudit_communications as CommunicationLogEntryData,
  GroupClassAuditQuery_groupClassAudit_meetingInfo as MeetingInfo,
  GroupClassAuditQuery_groupClassAudit_students as RegisteredStudent,
} from "@/frontend/common/graphql/generated/gql/graphql";

export type CommunicationType = "email" | "sms";
