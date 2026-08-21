import type { ProfilePageContext } from "@/backend/types";
import { ProfilePageClient } from "@/frontend/common/views/dashboard/profile/core/ProfilePageClient";

/**
 * Render ProfilePageClient from a pre-resolved ProfilePageContext.
 * Profile enums live in shared and match GraphQL wire values — no bridge.
 */
export function renderProfilePageClient(resolution: ProfilePageContext, nationalIdComplete?: boolean) {
  return (
    <ProfilePageClient
      scope={resolution.scope}
      mode={resolution.mode}
      audience={resolution.audience}
      targetUserId={resolution.targetUserId}
      studentId={resolution.studentId}
      nationalIdComplete={nationalIdComplete}
    />
  );
}
