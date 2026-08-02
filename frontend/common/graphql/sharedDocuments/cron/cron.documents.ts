import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

// ─── Fragments ───────────────────────────────────────────────────────────────

const CRON_SCHEDULE_FIELDS = gql`
  fragment CronScheduleFields on CronSchedule {
    id
    name
    description
    cronExpression
    jobKind
    payload
    status
    timezone
    nextRunAt
    lastRunAt
    concurrencyPolicy
    maxRetries
    retryBackoffSeconds
    timeoutSeconds
    createdAt
    updatedAt
  }
`;

const CRON_RUN_FIELDS = gql`
  fragment CronRunFields on CronRun {
    id
    scheduleId
    jobKind
    status
    triggerSource
    payload
    attempt
    startedAt
    completedAt
    durationMs
    errorMessage
    workerId
    createdAt
    updatedAt
  }
`;

const CRON_QUEUE_STATS_FIELDS = gql`
  fragment CronQueueStatsFields on CronQueueStats {
    id
    backend
    pending
    inFlight
    failed
    byJobKind
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

export const cronSchedulesQueryDocument: TypedDocumentNode<
  Operations.CronSchedulesQuery,
  Types.QueryCronSchedulesArgs
> = gql`
  ${CRON_SCHEDULE_FIELDS}
  query cronSchedules($input: CronScheduleListInput) {
    cronSchedules(input: $input) {
      rows {
        ...CronScheduleFields
      }
      totalCount
    }
  }
`;

export const cronRunsQueryDocument: TypedDocumentNode<Operations.CronRunsQuery, Types.QueryCronRunsArgs> = gql`
  ${CRON_RUN_FIELDS}
  query cronRuns($input: CronRunListInput) {
    cronRuns(input: $input) {
      rows {
        ...CronRunFields
      }
      totalCount
    }
  }
`;

export const cronQueueStatsQueryDocument: TypedDocumentNode<Operations.CronQueueStatsQuery> = gql`
  ${CRON_QUEUE_STATS_FIELDS}
  query cronQueueStats {
    cronQueueStats {
      ...CronQueueStatsFields
    }
  }
`;

// ─── Mutations ───────────────────────────────────────────────────────────────

export const cronScheduleCreateMutationDocument: TypedDocumentNode<
  Operations.CronScheduleCreateMutation,
  Types.MutationCronScheduleCreateArgs
> = gql`
  ${CRON_SCHEDULE_FIELDS}
  mutation cronScheduleCreate($input: CronScheduleSubmitInput!) {
    cronScheduleCreate(input: $input) {
      ...CronScheduleFields
    }
  }
`;

export const cronScheduleUpdateMutationDocument: TypedDocumentNode<
  Operations.CronScheduleUpdateMutation,
  Types.MutationCronScheduleUpdateArgs
> = gql`
  ${CRON_SCHEDULE_FIELDS}
  mutation cronScheduleUpdate($id: String!, $input: CronScheduleUpdateInput!) {
    cronScheduleUpdate(id: $id, input: $input) {
      ...CronScheduleFields
    }
  }
`;

export const cronSchedulePauseMutationDocument: TypedDocumentNode<
  Operations.CronSchedulePauseMutation,
  Types.MutationCronSchedulePauseArgs
> = gql`
  ${CRON_SCHEDULE_FIELDS}
  mutation cronSchedulePause($id: String!) {
    cronSchedulePause(id: $id) {
      ...CronScheduleFields
    }
  }
`;

export const cronScheduleResumeMutationDocument: TypedDocumentNode<
  Operations.CronScheduleResumeMutation,
  Types.MutationCronScheduleResumeArgs
> = gql`
  ${CRON_SCHEDULE_FIELDS}
  mutation cronScheduleResume($id: String!) {
    cronScheduleResume(id: $id) {
      ...CronScheduleFields
    }
  }
`;

export const cronScheduleDeleteMutationDocument: TypedDocumentNode<
  Operations.CronScheduleDeleteMutation,
  Types.MutationCronScheduleDeleteArgs
> = gql`
  mutation cronScheduleDelete($input: CronScheduleDeleteInput!) {
    cronScheduleDelete(input: $input)
  }
`;

export const cronRunTriggerMutationDocument: TypedDocumentNode<
  Operations.CronRunTriggerMutation,
  Types.MutationCronRunTriggerArgs
> = gql`
  ${CRON_RUN_FIELDS}
  mutation cronRunTrigger($input: CronRunTriggerInput!) {
    cronRunTrigger(input: $input) {
      ...CronRunFields
    }
  }
`;
