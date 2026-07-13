import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const classInstanceQueryDocument: TypedDocumentNode<
  Operations.ClassInstanceQuery,
  Types.QueryClassInstanceArgs
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query classInstance($id: ID!) {
    classInstance(id: $id) {
      id
      courseName
      classType
      instanceId
      scheduledDate
      startTime
      endTime
      durationMinutes
      status
      remarks
      hasTimezoneMismatch
      studentTimezone
      teacherTimezone
      meetingJoinUrl
      recurringScheduleId
      effectiveMeeting {
        ...EffectiveMeetingFields
      }
      payrollCredited
      isRescheduled
      isFrozen
      executionState
      outcome
      avatarUrl
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
        id
        engagementScore
        assessmentProgress
        assessmentTotal
        focusLevel
        sessionHealth
        heatmapData
        latencyMs
        authorizationLabel
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
      meetingJoinUrl
    }
  }
`;

export const activateOverrideClassMutationDocument: TypedDocumentNode<
  Operations.ActivateOverrideClassMutation,
  Types.MutationActivateOverrideClassArgs
> = gql`
  mutation activateOverrideClass($classInstanceId: ID!) {
    activateOverrideClass(classInstanceId: $classInstanceId) {
      id
      executionState
      status
      durationMinutes
      remarks
      meetingJoinUrl
    }
  }
`;

export const resetClassMutationDocument: TypedDocumentNode<
  Operations.ResetClassMutation,
  Types.MutationResetClassArgs
> = gql`
  mutation resetClass($classInstanceId: ID!) {
    resetClass(classInstanceId: $classInstanceId)
  }
`;

export const updateSessionStatusStartMutationDocument: TypedDocumentNode<
  Operations.UpdateSessionStatusStartMutation,
  Types.MutationUpdateSessionStatusStartArgs
> = gql`
  mutation updateSessionStatusStart($classInstanceId: ID!) {
    updateSessionStatusStart(classInstanceId: $classInstanceId) {
      id
      executionState
      status
      durationMinutes
      remarks
    }
  }
`;

export const updateSessionStatusAbsentMutationDocument: TypedDocumentNode<
  Operations.UpdateSessionStatusAbsentMutation,
  Types.MutationUpdateSessionStatusAbsentArgs
> = gql`
  mutation updateSessionStatusAbsent($classInstanceId: ID!) {
    updateSessionStatusAbsent(classInstanceId: $classInstanceId) {
      id
      executionState
      outcome
      payrollCredited
      status
      durationMinutes
      remarks
    }
  }
`;

export const updateSessionStatusLeaveMutationDocument: TypedDocumentNode<
  Operations.UpdateSessionStatusLeaveMutation,
  Types.MutationUpdateSessionStatusLeaveArgs
> = gql`
  mutation updateSessionStatusLeave($classInstanceId: ID!, $leaveReason: String!) {
    updateSessionStatusLeave(classInstanceId: $classInstanceId, leaveReason: $leaveReason) {
      completedInstanceId
      rescheduledInstanceId
      completedInstance {
        id
        outcome
        isRescheduled
      }
      rescheduledInstance {
        id
        scheduledDate
        startTime
        endTime
      }
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

export const deleteClassInstanceMutationDocument: TypedDocumentNode<
  Operations.DeleteClassInstanceMutation,
  Types.MutationDeleteClassInstanceArgs
> = gql`
  mutation deleteClassInstance($classInstanceId: ID!) {
    deleteClassInstance(classInstanceId: $classInstanceId)
  }
`;
