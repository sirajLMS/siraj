import { getServerUserContext } from "@/backend/lib";
import { ProfileService } from "@/backend/services";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { redirect } from "@/shared/i18n";

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function ParentProfileRedirectPage({ params }: PageProps) {
  const { id } = await params;

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  const targetUserId = await ProfileService.resolveUserIdForParentId(id);
  if (!targetUserId) {
    redirect({ href: "/dashboard" });
    return;
  }

  redirect({ href: `/users/${targetUserId}/profile` });
}
