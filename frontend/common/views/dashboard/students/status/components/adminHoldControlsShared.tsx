"use client";

import { Box } from "@mui/material";
import {
  ReasonEntryField,
  StatusSelectionField,
  SubmitStatusButton,
} from "@/frontend/common/views/dashboard/students/status/components/adminHoldControlsShared.parts";
import type { AdminHoldControlsProps } from "@/frontend/common/views/dashboard/students/status/types";
import type { AdminHoldControlsSlotProps } from "@/frontend/common/views/dashboard/students/status/types/adminHoldControlsShared.types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";

export interface AdminHoldControlsSharedProps {
  readonly props: Readonly<AdminHoldControlsProps>;
  readonly slots: AdminHoldControlsSlotProps;
  readonly containerGap?: number;
}

export function AdminHoldControlsShared({ props, slots, containerGap = 3 }: Readonly<AdminHoldControlsSharedProps>) {
  const t = useStudentStatusLabels();
  const { AdminControlPanel } = slots;

  return (
    <AdminControlPanel title={t.sections.adminHold}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: containerGap }}>
        <StatusSelectionField />
        <ReasonEntryField slots={slots} />
        <SubmitStatusButton isUpdating={props.isUpdating} slots={slots} />
      </Box>
    </AdminControlPanel>
  );
}
