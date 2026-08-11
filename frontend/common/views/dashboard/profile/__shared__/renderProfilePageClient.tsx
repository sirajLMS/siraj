import { toGqlProfileAudience, toGqlProfileMode, toGqlProfileScope } from "@/app/(dashboard)/lib/profile-enum-bridge";
import type { ProfilePageContext } from "@/backend/types";
import type {
  ProfileAudience as GqlProfileAudience,
  ProfileMode as GqlProfileMode,
  ProfileScope as GqlProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfilePageClient } from "@/frontend/common/views/dashboard/profile/core/ProfilePageClient";

/**
 * Render ProfilePageClient from a pre-resolved ProfilePageContext.
 *
 * Converts backend enums to GQL enum types and passes through all props.
 * Used by both ProfilePageServer (full flow) and individual page files
 * that need to inspect the resolution before rendering (e.g., self-edit
 * forceComplete logic).
 */
export function renderProfilePageClient(resolution: ProfilePageContext, nationalIdComplete?: boolean) {
  return (
    <ProfilePageClient
      scope={toGqlProfileScope(resolution.scope) satisfies GqlProfileScope}
      mode={toGqlProfileMode(resolution.mode) satisfies GqlProfileMode}
      audience={toGqlProfileAudience(resolution.audience) satisfies GqlProfileAudience}
      targetUserId={resolution.targetUserId}
      studentId={resolution.studentId}
      nationalIdComplete={nationalIdComplete}
    />
  );
}
