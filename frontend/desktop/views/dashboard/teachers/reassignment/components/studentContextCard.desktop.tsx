// cspell:disable
"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import { StudentContextCardShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/studentContextCardShared";
import type { StudentContextCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { StudentContextCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/reassignmentComponentsShared.types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";

const slots: StudentContextCardSlotProps = {
  CardContainer: BaseCard,
  UserAvatar: DesktopUserAvatar,
  StatusBadge: DesktopStatusBadge,
};

export function StudentContextCardDesktop(props: Readonly<StudentContextCardProps>) {
  return <StudentContextCardShared props={props} slots={slots} />;
}
