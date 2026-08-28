"use client";

import { TeacherOwnProfileShared } from "@/frontend/common/views/dashboard/teachers/own-profile/__shared__/teacherOwnProfileShared";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { MobileContentStack, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

export function TeacherOwnProfileMobileView({ ...vm }: Readonly<TeacherOwnProfileViewModel>) {
  return (
    <TeacherOwnProfileShared
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

export default TeacherOwnProfileMobileView;
