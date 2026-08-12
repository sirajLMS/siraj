"use client";

import {
  MobileProfileLayout,
  MobileProfileSection,
} from "@/frontend/common/views/dashboard/profile/__shared__/profileLayoutShared";
import { TeacherOwnProfileShared } from "@/frontend/common/views/dashboard/teachers/own-profile/__shared__/teacherOwnProfileShared";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

export function TeacherOwnProfileMobileView({ ...vm }: Readonly<TeacherOwnProfileViewModel>) {
  return (
    <TeacherOwnProfileShared
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

export default TeacherOwnProfileMobileView;
