import { InMemoryCache } from "@apollo/client";

/**
 * Apollo cache with type policies for paginated / filtered list results.
 *
 * `AdminDashboardScheduleResult.rows` must replace (not merge) on write:
 * filter/pagination changes legitimately return different arrays, including empty ones.
 * Without `merge: false`, Apollo warns that cache data may be lost.
 *
 * `OnlineMeetingInfo` and `AdminNoteInfo` are embedded value types with no `id`
 * field (see `frontend/common/graphql/generated/schema.graphql`). Marking them
 * `keyFields: false` opts them out of normalization so Apollo does not emit
 * "Cache data may be lost" warnings when these types are written to the cache
 * via different parent objects. They are always read back through their
 * enclosing parent (e.g. a `Session` or `AdminNote` owner), so identifying them
 * by their own fields is unnecessary.
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
      AdminNoteInfo: {
        keyFields: false,
      },
      OnlineMeetingInfo: {
        keyFields: false,
      },
    },
  });
}
