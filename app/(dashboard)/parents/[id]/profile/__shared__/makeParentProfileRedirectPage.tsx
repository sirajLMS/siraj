import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ProfileService } from "@/backend/services/profile/profile.service";
import { redirect } from "@/shared/i18n";

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

/**
 * Factory for parent profile redirect pages.
 * @param targetPath - The path template to redirect to, e.g. "/profile" or "/profile/edit"
 * @returns A Next.js page component wrapped with withPageAuth
 */
export function makeParentProfileRedirectPage(targetPath: string) {
  return withPageAuth<PageProps>(null, async (_auth, { params }) => {
    const { id } = await params;
    const targetUserId = await ProfileService.resolveUserIdForParentId(id);
    if (!targetUserId) {
      redirect({ href: "/dashboard" });
      return undefined;
    }
    redirect({ href: `/users/${targetUserId}${targetPath}` });
    return undefined;
  });
}
