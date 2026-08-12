import { resolveProfilePageContext } from "@/backend/lib/auth/cached-profile";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import type { ProfileMode } from "@/backend/types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { renderProfilePageClient } from "@/frontend/common/views/dashboard/profile/__shared__/renderProfilePageClient";
import { redirect } from "@/shared/i18n/routing";

export interface ProfilePageServerProps {
  readonly mode: ProfileMode;
  readonly targetUserId?: string;
  /** Server-provided gate for teacher own-profile edit force-complete redirects. */
  readonly nationalIdComplete?: boolean;
}

/**
 * Shared server component for profile page routes.
 *
 * Encapsulates the common pattern shared by profile page routes:
 * 1. Auth check via getServerUserContext -> redirectToLogin
 * 2. resolveProfilePageContext -> redirect if needed
 * 3. Render ProfilePageClient with converted GQL enum types
 *
 * Route-specific logic (generateMetadata, forceComplete searchParams handling)
 * stays in the individual page.tsx files. Pages that need to inspect the
 * resolution before rendering should call resolveProfilePageContext directly
 * and use renderProfilePageClient for the final render.
 */
export async function ProfilePageServer({ mode, targetUserId, nationalIdComplete }: Readonly<ProfilePageServerProps>) {
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return null;
  }

  const resolution = await resolveProfilePageContext(userId, context, {
    targetUserId,
    mode,
  });
  if ("redirect" in resolution) {
    redirect({ href: resolution.redirect });
    return undefined;
  }

  return renderProfilePageClient(resolution, nationalIdComplete);
}
