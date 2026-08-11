import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ProfileService } from "@/backend/services";
import { redirect } from "@/shared/i18n";

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default withPageAuth<PageProps>(null, async (_auth, { params }) => {
  const { id } = await params;
  const targetUserId = await ProfileService.resolveUserIdForParentId(id);
  if (!targetUserId) {
    redirect({ href: "/dashboard" });
    return undefined;
  }

  redirect({ href: `/users/${targetUserId}/profile/edit` });
  return undefined;
});
