"use client";

import {
  DesktopProfileLayout,
  DesktopProfileSection,
} from "@/frontend/common/views/dashboard/profile/__shared__/profileLayoutShared";
import { SupervisorProfileShared } from "@/frontend/common/views/dashboard/supervisor/profile/__shared__/supervisorProfileShared";
import type { SupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function SupervisorProfileDesktopView({ ...vm }: Readonly<SupervisorProfileViewModel>) {
  return (
    <SupervisorProfileShared
      vm={vm}
      options={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        ProfileLayout: DesktopProfileLayout,
        ProfileSection: DesktopProfileSection,
      }}
    />
  );
}
