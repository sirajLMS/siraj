import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const groupClassAuditQueryDocument: TypedDocumentNode<
  Operations.GroupClassAuditQuery,
  Types.QueryGroupClassAuditArgs
> = gql`
  query groupClassAudit($classInstanceId: String!) {
    groupClassAudit(classInstanceId: $classInstanceId) {
      id
      className
      courseCode
      teacherName
      originalDate
      rescheduledDate
      timeSlot
      venue
      status
      outcome
      isFrozen
      auditRemark
      auditLoggedAt
      registeredStudentCount
      totalStudentCount
      students {
        id
        name
        studentId
        initials
        attendanceStatus
        avatarUrl
      }
      meetingInfo {
        platform
        meetingId
        joinUrl
        logoUrl
        providerName
        source
      }
      communications {
        id
        type
        title
        description
        isActive
        isDelivered
        timestamp
      }
      adminNote {
        content
        lastUpdated
      }
    }
  }
`;

export const updateClassAdminNoteMutationDocument: TypedDocumentNode<
  Operations.UpdateClassAdminNoteMutation,
  Types.MutationUpdateClassAdminNoteArgs
> = gql`
  mutation updateClassAdminNote($classInstanceId: String!, $content: String!) {
    updateClassAdminNote(classInstanceId: $classInstanceId, content: $content) {
      id
      className
      courseCode
      teacherName
      originalDate
      rescheduledDate
      timeSlot
      venue
      status
      outcome
      isFrozen
      auditRemark
      auditLoggedAt
      registeredStudentCount
      totalStudentCount
      students {
        id
        name
        studentId
        initials
        attendanceStatus
        avatarUrl
      }
      meetingInfo {
        platform
        meetingId
        joinUrl
        logoUrl
        providerName
        source
      }
      communications {
        id
        type
        title
        description
        isActive
        isDelivered
        timestamp
      }
      adminNote {
        content
        lastUpdated
      }
    }
  }
`;

export const resendClassNotificationsMutationDocument: TypedDocumentNode<
  Operations.ResendClassNotificationsMutation,
  Types.MutationResendClassNotificationsArgs
> = gql`
  mutation resendClassNotifications($classInstanceId: String!) {
    resendClassNotifications(classInstanceId: $classInstanceId) {
      id
      success
    }
  }
`;
