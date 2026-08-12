import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PermissionManagementContainer } from "@/frontend/common/views/dashboard/permissions/PermissionManagementContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.permissions;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.PERMISSION_GROUPS_MANAGE], async () => {
  return <PermissionManagementContainer />;
});
