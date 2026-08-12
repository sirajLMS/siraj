// cspell:disable
"use client";

import { ReassignmentBentoGridShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/reassignmentBentoGridShared";
import type { ReassignmentBentoGridProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { ReassignmentBentoGridSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/reassignmentComponentsShared.types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

const slots: ReassignmentBentoGridSlotProps = {
  CardContainer: MobileBaseCard,
  UserAvatar: MobileUserAvatar,
};

export function ReassignmentBentoGridMobile(props: Readonly<ReassignmentBentoGridProps>) {
  return <ReassignmentBentoGridShared props={props} slots={slots} />;
}
