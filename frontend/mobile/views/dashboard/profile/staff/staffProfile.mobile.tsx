"use client";

import type React from "react";
import type { StaffProfileSharedSlots } from "@/frontend/common/views/dashboard/profile/__shared__/staffProfileShared";
import { StaffProfileSharedView } from "@/frontend/common/views/dashboard/profile/__shared__/staffProfileShared";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { MobileContentStack } from "@/frontend/mobile/components/ui";

const MobileViewContentWrapper: React.ComponentType<{ readonly children: React.ReactNode }> = ({ children }) => (
  <MobileContentStack>{children}</MobileContentStack>
);

const mobileSlots: StaffProfileSharedSlots = {
  ViewContentWrapper: MobileViewContentWrapper,
};

export function StaffProfileMobileView(props: Readonly<StaffProfileViewModel>): React.JSX.Element | null {
  return <StaffProfileSharedView {...props} {...mobileSlots} />;
}
