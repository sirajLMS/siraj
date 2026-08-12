// cspell:disable
"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import { CurrentTeacherCardShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/currentTeacherCardShared";
import type { CurrentTeacherCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { CurrentTeacherCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/reassignmentComponentsShared.types";

const slots: CurrentTeacherCardSlotProps = {
  CardContainer: BaseCard,
};

export function CurrentTeacherCardDesktop(props: Readonly<CurrentTeacherCardProps>) {
  return <CurrentTeacherCardShared props={props} slots={slots} />;
}
