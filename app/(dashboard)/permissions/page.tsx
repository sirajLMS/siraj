import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission as GraphQLAppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { PermissionManagementContainer } from "@/frontend/common/views/dashboard/permissions/PermissionManagementContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.permissions;
  return { title: t.pageTitle };
}

export default async function PermissionsPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.PERMISSION_GROUPS_MANAGE], locale, context);
  return (
    <RequirePermission permissions={[GraphQLAppPermission.PermissionGroupsManage]}>
      <PermissionManagementContainer />
    </RequirePermission>
  );
}
