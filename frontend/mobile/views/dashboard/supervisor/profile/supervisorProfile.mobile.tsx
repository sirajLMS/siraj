"use client";

import { SupervisorProfileShared } from "@/frontend/common/views/dashboard/supervisor/profile/__shared__/supervisorProfileShared";
import type { SupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { MobileContentStack, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

export function SupervisorProfileMobileView({ ...vm }: Readonly<SupervisorProfileViewModel>) {
  return (
    <SupervisorProfileShared
      vm={vm}
      options={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        ProfileLayout: MobileContentStack,
        ProfileSection: MobileSectionPanel,
      }}
    />
  );
}
