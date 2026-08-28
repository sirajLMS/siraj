// cspell:disable
"use client";

import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { ManagementControlsCardShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/managementControlsCardShared";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { ManagementControlsCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/managementControlsCardShared.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge/DesktopStatusBadge";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect/teacherAutocomplete.desktop";

const slots: ManagementControlsCardSlotProps = {
  CardContainer: BaseCard,
  StatusBadge: DesktopStatusBadge,
  TeacherAutocomplete: TeacherAutocompleteDesktop,
  CancelAction: DesktopFilterButton,
  SubmitAction: DesktopPrimaryPageAction,
};

export function ManagementControlsCardDesktop(props: Readonly<ManagementControlsCardProps>) {
  return <ManagementControlsCardShared props={props} slots={slots} />;
}
