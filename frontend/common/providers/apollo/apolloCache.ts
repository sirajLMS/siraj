import { InMemoryCache } from "@apollo/client";

/**
 * Apollo cache with type policies for paginated / filtered list results.
 *
 * `AdminDashboardScheduleResult.rows` must replace (not merge) on write:
 * filter/pagination changes legitimately return different arrays, including empty ones.
 * Without `merge: false`, Apollo warns that cache data may be lost.
 */
export function createApolloCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      AdminDashboardScheduleResult: {
        fields: {
          rows: {
            merge: false,
          },
        },
      },
    },
  });
}
