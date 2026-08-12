// cspell:disable
"use client";

import { StudentContextCardShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/studentContextCardShared";
import type { StudentContextCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { StudentContextCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/reassignmentComponentsShared.types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

const slots: StudentContextCardSlotProps = {
  CardContainer: MobileBaseCard,
  UserAvatar: MobileUserAvatar,
  StatusBadge: MobileStatusBadge,
};

export function StudentContextCardMobile(props: Readonly<StudentContextCardProps>) {
  return <StudentContextCardShared props={props} slots={slots} />;
}
