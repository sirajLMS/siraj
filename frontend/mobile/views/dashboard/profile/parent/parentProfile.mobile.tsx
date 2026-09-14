"use client";

import type { ReactNode } from "react";
import { ParentProfileShared } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { MobileContentStack } from "@/frontend/mobile/components/ui";
import { AssociatedStudentsSectionMobileView } from "@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsSection.mobile";

function MobileViewContentWrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <MobileContentStack>{children}</MobileContentStack>;
}

const mobileSlots = {
  ViewContentWrapper: MobileViewContentWrapper,
  StudentsSection: AssociatedStudentsSectionMobileView,
};

export function ParentProfileMobileView(props: Readonly<ParentProfileViewModel>) {
  return <ParentProfileShared {...props} slots={mobileSlots} />;
}
