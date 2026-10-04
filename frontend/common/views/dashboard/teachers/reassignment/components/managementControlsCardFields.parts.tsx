"use client";

import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { ALLOWED_TARGET_STATUSES } from "@/frontend/common/utils/student-status-transitions";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type {
  ManagementControlsCardSlotProps,
  SharedTeacherAutocompleteProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types/managementControlsCardShared.types";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment";

export type ManagementControlsLabels = Pick<TeacherReassignmentLabels, "controls" | "actions">;

export function TeacherSelection({
  selectedTeacherId,
  onTeacherChange,
  labels,
  TeacherAutocomplete,
}: Readonly<{
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
  labels: ManagementControlsLabels["controls"];
  TeacherAutocomplete: React.ComponentType<SharedTeacherAutocompleteProps>;
}>) {
  const [selectedTeacher, setSelectedTeacher] = useState<PersonOption | null>(null);
  const value = selectedTeacher ?? resolvePersonOption(selectedTeacherId, [], selectedTeacher);

  return (
    <Box>
      <TeacherAutocomplete
        value={value}
        onChange={(next: PersonOption | null) => {
          setSelectedTeacher(next);
          onTeacherChange(next?.id ?? "");
        }}
        label={labels.assignTeacher}
        placeholder={labels.assignTeacherPlaceholder}
      />
      <FormHelperText sx={{ fontStyle: "italic", mt: 1 }}>{labels.teacherAvailabilityNotice}</FormHelperText>
    </Box>
  );
}

export function StatusUpdate({
  currentStatus,
  selectedStatus,
  onStatusChange,
  labels,
  statusLabelId,
  StatusBadge,
}: Readonly<{
  currentStatus: StudentStatus;
  selectedStatus: StudentStatus | "";
  onStatusChange: (status: StudentStatus | "") => void;
  labels: ManagementControlsLabels["controls"];
  statusLabelId: string;
  StatusBadge: ManagementControlsCardSlotProps["StatusBadge"];
}>) {
  const statusKey = STUDENT_STATUS_TO_ACCOUNT_STATUS[currentStatus] ?? currentStatus;

  const allowedTargets = ALLOWED_TARGET_STATUSES[currentStatus] ?? [];

  return (
    <Box>
      <FormControl fullWidth size="small" sx={outlinedInputSx}>
        <InputLabel id={statusLabelId} shrink>
          {labels.statusUpdate}
        </InputLabel>
        <Select
          value={selectedStatus}
          labelId={statusLabelId}
          label={labels.statusUpdate}
          onChange={e => {
            const val = e.target.value;
            if (typeof val === "string") onStatusChange(val);
          }}
        >
          {allowedTargets.map(status => (
            <MenuItem key={status} value={status}>
              {labels.statusOptions[status]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.currentStatus("").replace(":", "").trim()}:
        </Typography>
        <StatusBadge category="studentAccount" status={statusKey} label={currentStatus} />
      </Box>
    </Box>
  );
}
