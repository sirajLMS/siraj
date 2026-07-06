import type { User } from "@/frontend/graphql/generated/gql/graphql-types";

type RefreshTokenMutationResult = {
  data?: {
    refreshToken?: {
      token?: string | null;
      user?: User | null;
    } | null;
  } | null;
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
  if (!inFlightRefresh) {
    inFlightRefresh = refresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}
