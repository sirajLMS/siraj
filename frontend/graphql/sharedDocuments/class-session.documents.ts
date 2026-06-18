import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const classInstanceQueryDocument: TypedDocumentNode<
  Operations.ClassInstanceQuery,
  Types.QueryClassInstanceArgs
> = gql`
  query classInstance($id: ID!) {
    classInstance(id: $id) {
      id
      courseName
      instanceId
      scheduledDate
      startTime
      endTime
      durationMinutes
      status
      remarks
      hasTimezoneMismatch
      studentTimezone
      zoomMeetingUrl
      student {
        id
        name
        grade
        level
        avatarUrl
      }
      teacher {
        id
        name
        title
        avatarUrl
      }
      performance {
        engagementScore
        assessmentProgress
        assessmentTotal
        focusLevel
        sessionHealth
        heatmapData
        latencyMs
        attendanceRate
        avgGrade
        lastClassDaysAgo
      }
    }
  }
`;

export const classStatusEventsQueryDocument: TypedDocumentNode<
  Operations.ClassStatusEventsQuery,
  Types.QueryClassStatusEventsArgs
> = gql`
  query classStatusEvents($classInstanceId: ID!) {
    classStatusEvents(classInstanceId: $classInstanceId) {
      id
      eventType
      description
      createdAt
    }
  }
`;

export const activateClassMutationDocument: TypedDocumentNode<
  Operations.ActivateClassMutation,
  Types.MutationActivateClassArgs
> = gql`
  mutation activateClass($classInstanceId: ID!) {
    activateClass(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
      zoomMeetingUrl
    }
  }
`;

export const forceActivateClassMutationDocument: TypedDocumentNode<
  Operations.ForceActivateClassMutation,
  Types.MutationForceActivateClassArgs
> = gql`
  mutation forceActivateClass($classInstanceId: ID!) {
    forceActivateClass(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
      zoomMeetingUrl
    }
  }
`;

export const stopClassMutationDocument: TypedDocumentNode<Operations.StopClassMutation, Types.MutationStopClassArgs> =
  gql`
  mutation stopClass($classInstanceId: ID!) {
    stopClass(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const startClassMutationDocument: TypedDocumentNode<
  Operations.StartClassMutation,
  Types.MutationStartClassArgs
> = gql`
  mutation startClass($classInstanceId: ID!) {
    startClass(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const markClassAbsentMutationDocument: TypedDocumentNode<
  Operations.MarkClassAbsentMutation,
  Types.MutationMarkClassAbsentArgs
> = gql`
  mutation markClassAbsent($classInstanceId: ID!) {
    markClassAbsent(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const requestClassLeaveMutationDocument: TypedDocumentNode<
  Operations.RequestClassLeaveMutation,
  Types.MutationRequestClassLeaveArgs
> = gql`
  mutation requestClassLeave($classInstanceId: ID!, $reason: String) {
    requestClassLeave(classInstanceId: $classInstanceId, reason: $reason) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const adminExcuseClassLeaveMutationDocument: TypedDocumentNode<
  Operations.AdminExcuseClassLeaveMutation,
  Types.MutationAdminExcuseClassLeaveArgs
> = gql`
  mutation adminExcuseClassLeave($classInstanceId: ID!) {
    adminExcuseClassLeave(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const rescheduleClassMutationDocument: TypedDocumentNode<
  Operations.RescheduleClassMutation,
  Types.MutationRescheduleClassArgs
> = gql`
  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {
    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {
      id
      status
      scheduledDate
      startTime
      endTime
      durationMinutes
    }
  }
`;

export const revertClassMutationDocument: TypedDocumentNode<
  Operations.RevertClassMutation,
  Types.MutationRevertClassArgs
> = gql`
  mutation revertClass($classInstanceId: ID!) {
    revertClass(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const deleteClassInstanceMutationDocument: TypedDocumentNode<
  Operations.DeleteClassInstanceMutation,
  Types.MutationDeleteClassInstanceArgs
> = gql`
  mutation deleteClassInstance($classInstanceId: ID!) {
    deleteClassInstance(classInstanceId: $classInstanceId)
  }
`;
