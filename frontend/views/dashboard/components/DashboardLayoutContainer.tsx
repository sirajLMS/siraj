import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { CurrentUserProfile } from "@/backend/types";
import { DashboardClientBridge } from "./DashboardClientBridge";

interface DashboardLayoutContainerProps {
  readonly children: ReactNode;
  readonly userProfile: CurrentUserProfile;
}

export async function DashboardLayoutContainer({ children, userProfile }: DashboardLayoutContainerProps) {
  const t = await getTranslations("dashboard.admin");

  return (
    <DashboardClientBridge userProfile={userProfile} roleLabel={t("roleLabel")}>
      {children}
    </DashboardClientBridge>
  );
}
