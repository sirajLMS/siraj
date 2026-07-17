import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";

/**
 * Shared props for MeetingConfigsTab tier variants (mobile/desktop).
 *
 * The switcher (`MeetingConfigsTab.tsx`) resolves `canManage` from the user
 * store and translation labels, then passes them to the tier variants so they
 * remain pure-presentational.
 */
export interface MeetingConfigsTabViewModel {
  readonly targetUserId: string;
  readonly canManage: boolean;
  readonly sectionTitle: string;
}

export type { ProfileScope };
