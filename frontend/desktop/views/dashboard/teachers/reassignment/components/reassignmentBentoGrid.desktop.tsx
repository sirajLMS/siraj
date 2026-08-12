// cspell:disable
"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import { ReassignmentBentoGridShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/reassignmentBentoGridShared";
import type { ReassignmentBentoGridProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { ReassignmentBentoGridSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/reassignmentComponentsShared.types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar";

const slots: ReassignmentBentoGridSlotProps = {
  CardContainer: BaseCard,
  UserAvatar: DesktopUserAvatar,
};

export function ReassignmentBentoGridDesktop(props: Readonly<ReassignmentBentoGridProps>) {
  return <ReassignmentBentoGridShared props={props} slots={slots} />;
}
