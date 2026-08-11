"use client";

import type { ReactNode } from "react";
import { ParentProfileShared } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { MobileContentStack, MobileSectionPanel } from "@/frontend/mobile/components/ui";

function MobileViewContentWrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <MobileContentStack>{children}</MobileContentStack>;
}

const mobileSlots = {
  ViewContentWrapper: MobileViewContentWrapper,
  SectionPanel: MobileSectionPanel,
};

export function ParentProfileMobileView(props: Readonly<ParentProfileViewModel>) {
  return <ParentProfileShared {...props} slots={mobileSlots} />;
}
