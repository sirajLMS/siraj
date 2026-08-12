"use client";

import {
  DesktopProfileLayout,
  DesktopProfileSection,
} from "@/frontend/common/views/dashboard/profile/__shared__/profileLayoutShared";
import { TeacherOwnProfileShared } from "@/frontend/common/views/dashboard/teachers/own-profile/__shared__/teacherOwnProfileShared";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function TeacherOwnProfileDesktopView({ ...vm }: Readonly<TeacherOwnProfileViewModel>) {
  return (
    <TeacherOwnProfileShared
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

export default TeacherOwnProfileDesktopView;
