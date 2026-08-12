"use client";

import {
  MobileProfileLayout,
  MobileProfileSection,
} from "@/frontend/common/views/dashboard/profile/__shared__/profileLayoutShared";
import { SupervisorProfileShared } from "@/frontend/common/views/dashboard/supervisor/profile/__shared__/supervisorProfileShared";
import type { SupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

export function SupervisorProfileMobileView({ ...vm }: Readonly<SupervisorProfileViewModel>) {
  return (
    <SupervisorProfileShared
      vm={vm}
      options={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        ProfileLayout: MobileProfileLayout,
        ProfileSection: MobileProfileSection,
      }}
    />
  );
}
