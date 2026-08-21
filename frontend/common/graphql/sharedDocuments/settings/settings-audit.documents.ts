import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  SettingsAuditLogsQuery,
  SettingsAuditLogsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const AUDIT_LOG_FIELDS = gql`
  fragment AuditLogFields on AuditLog {
    id
    actorUserId
    actorType
    entityType
    entityId
    action
    description
    previousState
    newState
    changes
    ipAddress
    userAgent
    metadata
    createdAt
  }
`;

export const settingsAuditLogsQueryDocument: TypedDocumentNode<
  SettingsAuditLogsQuery,
  SettingsAuditLogsQueryVariables
> = gql`
  ${AUDIT_LOG_FIELDS}
  query settingsAuditLogs($filter: SettingsAuditLogFilter) {
    settingsAuditLogs(filter: $filter) {
      id
      total
      hasMore
      logs {
        ...AuditLogFields
      }
    }
  }
`;
