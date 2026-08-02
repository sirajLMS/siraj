import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { redirect } from "@/shared/i18n/routing";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function StudentQuotasRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.QUOTAS_VIEW], locale, context);
  const { id } = await params;
  redirect({ href: `/students/${id}/profile?tab=quota` });
}
