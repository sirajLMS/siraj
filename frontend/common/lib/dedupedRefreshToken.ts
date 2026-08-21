import type { RefreshTokenMutation } from "@/frontend/common/graphql/generated/gql/graphql";

type RefreshTokenMutationResult = {
  data?: RefreshTokenMutation | null;
};

let inFlightRefresh: Promise<RefreshTokenMutationResult> | null = null;

/**
 * Deduplicates concurrent refreshToken mutation calls.
 * React Strict Mode and parallel mounts can fire two refresh calls; without
 * deduplication the second call may fail JTI validation after the first rotates.
 */
export function dedupedRefreshToken(
  refresh: () => Promise<RefreshTokenMutationResult>
): Promise<RefreshTokenMutationResult> {
  inFlightRefresh ??= refresh().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}
