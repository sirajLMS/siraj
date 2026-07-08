import { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export const ALLOWED_STATUS_TRANSITIONS: Record<StudentStatus, readonly StudentStatus[]> = {
  [StudentStatus.OnTrial]: [StudentStatus.Regular, StudentStatus.Deactivated],
  [StudentStatus.Regular]: [StudentStatus.Suspended, StudentStatus.OnLeave, StudentStatus.Deactivated],
  [StudentStatus.Suspended]: [StudentStatus.Regular, StudentStatus.Deactivated],
  [StudentStatus.OnLeave]: [StudentStatus.Regular, StudentStatus.Deactivated],
  [StudentStatus.Deactivated]: [StudentStatus.Regular],
};

// GraphQL StudentStatus enum values are SCREAMING_SNAKE strings (e.g. StudentStatus.OnTrial = "ON_TRIAL").
// Object.entries on the Record yields the enum *values* (SCREAMING_SNAKE strings) as keys,
// which already match what consumers expect, so no reverse lookup is needed.
function mapTransitions(): Record<string, StudentStatus[]> {
  const result: Record<string, StudentStatus[]> = {};
  for (const [key, targets] of Object.entries(ALLOWED_STATUS_TRANSITIONS)) {
    result[key] = [...targets] as StudentStatus[];
  }
  return result;
}

export const ALLOWED_TARGET_STATUSES: Record<string, StudentStatus[]> = mapTransitions();
