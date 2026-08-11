// cspell:disable
"use client";

import { ManagementControlsCardShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/managementControlsCardShared";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { ManagementControlsCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/managementControlsCardShared.types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge/MobileStatusBadge";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card/MobileBaseCard";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect/teacherAutocomplete.mobile";

const slots: ManagementControlsCardSlotProps = {
  CardContainer: MobileBaseCard,
  StatusBadge: MobileStatusBadge,
  TeacherAutocomplete: TeacherAutocompleteMobile,
};

export function ManagementControlsCardMobile(props: Readonly<ManagementControlsCardProps>) {
  return <ManagementControlsCardShared props={props} slots={slots} />;
}
