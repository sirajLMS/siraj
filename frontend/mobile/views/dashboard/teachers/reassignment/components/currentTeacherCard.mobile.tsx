// cspell:disable
"use client";

import { CurrentTeacherCardShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/currentTeacherCardShared";
import type { CurrentTeacherCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { CurrentTeacherCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/reassignmentComponentsShared.types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

const slots: CurrentTeacherCardSlotProps = {
  CardContainer: MobileBaseCard,
};

export function CurrentTeacherCardMobile(props: Readonly<CurrentTeacherCardProps>) {
  return <CurrentTeacherCardShared props={props} slots={slots} />;
}
