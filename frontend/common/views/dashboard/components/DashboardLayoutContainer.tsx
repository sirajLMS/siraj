import type { ReactNode } from "react";
import type { User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { DashboardClientBridge } from "@/frontend/common/views/dashboard/components/DashboardClientBridge";
import { getLocale, getTranslations } from "@/shared/locale/server";

interface DashboardLayoutContainerProps {
  readonly children: ReactNode;
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
}

export async function DashboardLayoutContainer({ children, userProfile, isSuperAdmin }: DashboardLayoutContainerProps) {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.admin;

  return (
    <DashboardClientBridge userProfile={userProfile} isSuperAdmin={isSuperAdmin} roleLabel={t.roleLabel}>
      {children}
    </DashboardClientBridge>
  );
}
