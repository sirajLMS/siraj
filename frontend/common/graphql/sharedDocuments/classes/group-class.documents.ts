import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  GroupClassAuditQuery,
  GroupClassAuditQueryVariables,
  ResendClassNotificationsMutation,
  ResendClassNotificationsMutationVariables,
  UpdateClassAdminNoteMutation,
  UpdateClassAdminNoteMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const groupClassAuditQueryDocument: TypedDocumentNode<GroupClassAuditQuery, GroupClassAuditQueryVariables> = gql`
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
  UpdateClassAdminNoteMutation,
  UpdateClassAdminNoteMutationVariables
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
  ResendClassNotificationsMutation,
  ResendClassNotificationsMutationVariables
> = gql`
  mutation resendClassNotifications($classInstanceId: String!) {
    resendClassNotifications(classInstanceId: $classInstanceId) {
      id
      success
    }
  }
`;
