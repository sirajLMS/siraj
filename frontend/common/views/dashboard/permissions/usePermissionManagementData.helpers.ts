import { OverrideState } from "@/frontend/common/graphql/generated/gql/graphql";

export const USERS_QUERY_VARIABLES = { search: null, limit: 50, offset: 0 };

const OVERRIDE_STATE_VALUES = new Set(Object.values(OverrideState) as readonly string[]);

export function isOverrideState(value: string): value is OverrideState {
  return OVERRIDE_STATE_VALUES.has(value);
}
