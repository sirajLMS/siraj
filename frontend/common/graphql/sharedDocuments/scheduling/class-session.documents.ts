import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ActivateClassMutation,
  ActivateClassMutationVariables,
  ActivateOverrideClassMutation,
  ActivateOverrideClassMutationVariables,
  ClassInstanceQuery,
  ClassInstanceQueryVariables,
  ClassStatusEventsQuery,
  ClassStatusEventsQueryVariables,
  DeleteClassInstanceMutation,
  DeleteClassInstanceMutationVariables,
  OverrideClassInstanceRateMutation,
  OverrideClassInstanceRateMutationVariables,
  ResetClassMutation,
  ResetClassMutationVariables,
  StopClassMutation,
  StopClassMutationVariables,
  UpdateSessionStatusAbsentMutation,
  UpdateSessionStatusAbsentMutationVariables,
  UpdateSessionStatusLeaveMutation,
  UpdateSessionStatusLeaveMutationVariables,
  UpdateSessionStatusStartMutation,
  UpdateSessionStatusStartMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const classInstanceQueryDocument: TypedDocumentNode<ClassInstanceQuery, ClassInstanceQueryVariables> = gql`
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
      recurringScheduleId
      effectiveMeeting {
        ...EffectiveMeetingFields
      }
      payrollCredited
      calculationStatus
      teacherPaidAmount
      teacherPaidCurrency
      calculatedDuration
      isPartialPercentage
      payrollNote
      payrollCalculatedAt
      isRescheduled
      isFrozen
      executionState
      outcome
      avatarUrl
      subjectId
      subjectName
      subjectAvatarUrl
      rateAmount
      rateCurrency
      isRateOverridden
      rateSource
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
  ClassStatusEventsQuery,
  ClassStatusEventsQueryVariables
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

export const activateClassMutationDocument: TypedDocumentNode<ActivateClassMutation, ActivateClassMutationVariables> =
  gql`
  mutation activateClass($classInstanceId: ID!) {
    activateClass(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const activateOverrideClassMutationDocument: TypedDocumentNode<
  ActivateOverrideClassMutation,
  ActivateOverrideClassMutationVariables
> = gql`
  mutation activateOverrideClass($classInstanceId: ID!) {
    activateOverrideClass(classInstanceId: $classInstanceId) {
      id
      executionState
      status
      durationMinutes
      remarks
    }
  }
`;

export const resetClassMutationDocument: TypedDocumentNode<ResetClassMutation, ResetClassMutationVariables> = gql`
  mutation resetClass($classInstanceId: ID!) {
    resetClass(classInstanceId: $classInstanceId)
  }
`;

export const updateSessionStatusStartMutationDocument: TypedDocumentNode<
  UpdateSessionStatusStartMutation,
  UpdateSessionStatusStartMutationVariables
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
  UpdateSessionStatusAbsentMutation,
  UpdateSessionStatusAbsentMutationVariables
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
  UpdateSessionStatusLeaveMutation,
  UpdateSessionStatusLeaveMutationVariables
> = gql`
  mutation updateSessionStatusLeave($classInstanceId: ID!, $leaveReason: String!) {
    updateSessionStatusLeave(classInstanceId: $classInstanceId, leaveReason: $leaveReason) {
      id
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

export const stopClassMutationDocument: TypedDocumentNode<StopClassMutation, StopClassMutationVariables> = gql`
  mutation stopClass($classInstanceId: ID!) {
    stopClass(classInstanceId: $classInstanceId) {
      id
      status
      durationMinutes
      remarks
    }
  }
`;

export const deleteClassInstanceMutationDocument: TypedDocumentNode<
  DeleteClassInstanceMutation,
  DeleteClassInstanceMutationVariables
> = gql`
  mutation deleteClassInstance($classInstanceId: ID!) {
    deleteClassInstance(classInstanceId: $classInstanceId) {
      success
      warnings
    }
  }
`;

export const overrideClassInstanceRateMutationDocument: TypedDocumentNode<
  OverrideClassInstanceRateMutation,
  OverrideClassInstanceRateMutationVariables
> = gql`
  mutation overrideClassInstanceRate($classInstanceId: ID!, $rateAmount: String, $rateCurrency: CurrencyCode) {
    overrideClassInstanceRate(classInstanceId: $classInstanceId, rateAmount: $rateAmount, rateCurrency: $rateCurrency) {
      id
      rateAmount
      rateCurrency
      isRateOverridden
      rateSource
    }
  }
`;
