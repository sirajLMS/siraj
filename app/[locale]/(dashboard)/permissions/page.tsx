import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PermissionManagementContainer } from "@/frontend/common/views/dashboard/permissions/PermissionManagementContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.permissions" });
  return { title: t("pageTitle") };
}

export default function PermissionsPage() {
  return (
    <RequirePermission permissions={[AppPermission.PermissionGroupsManage]}>
      <PermissionManagementContainer />
    </RequirePermission>
  );
}
