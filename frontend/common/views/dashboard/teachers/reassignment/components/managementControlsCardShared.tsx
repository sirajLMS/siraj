// cspell:disable
"use client";

import { CheckCircleOutlined, InfoOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { ALLOWED_TARGET_STATUSES } from "@/frontend/common/utils/student-status-transitions";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type {
  ManagementControlsCardSlotProps,
  SharedTeacherAutocompleteProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types/managementControlsCardShared.types";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment";

type ManagementLabels = Pick<TeacherReassignmentLabels, "controls" | "actions">;

export interface ManagementControlsCardSharedProps {
  readonly props: Readonly<ManagementControlsCardProps>;
  readonly slots: ManagementControlsCardSlotProps;
}

function TeacherSelection({
  selectedTeacherId,
  onTeacherChange,
  labels,
  TeacherAutocomplete,
}: Readonly<{
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
  labels: ManagementLabels["controls"];
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

function StatusUpdate({
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
  labels: ManagementLabels["controls"];
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

function ActionButtons({
  loading,
  saved,
  onCancel,
  labels,
}: Readonly<{
  loading: boolean;
  saved: boolean;
  onCancel: () => void;
  labels: ManagementLabels["actions"];
}>) {
  const getButtonContent = (): React.ReactNode => {
    if (loading) return <CircularProgress size={18} color="inherit" />;
    if (saved) {
      return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
          <CheckCircleOutlined sx={{ fontSize: 16 }} />
          <Typography variant="labelSm">{labels.saved}</Typography>
        </Stack>
      );
    }
    return <Typography variant="labelSm">{labels.submit}</Typography>;
  };

  return (
    <Box
      sx={theme => ({
        pt: 3,
        borderTop: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={theme => ({ alignItems: "center", color: theme.palette.onSurfaceVariant })}
      >
        <InfoOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="labelSm">{labels.info}</Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          fullWidth
          sx={theme => ({
            flex: 1,
            minWidth: 100,
            py: 1,
            fontWeight: 700,
            color: theme.palette.onSurfaceVariant,
            borderColor: theme.palette.border.main,
            "&:hover": {
              borderColor: theme.palette.border.main,
              backgroundColor: theme.palette.surfaceContainerLow,
            },
          })}
        >
          {labels.cancel}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || saved}
          fullWidth
          sx={theme => ({
            flex: 1,
            minWidth: 140,
            py: 1,
            fontWeight: 700,
            backgroundColor: saved ? theme.palette.success.main : theme.palette.primary.main,
            color: saved ? theme.palette.onSuccess : theme.palette.onPrimary,
            "&:hover": {
              backgroundColor: saved ? theme.palette.success.dark : theme.palette.primary.dark,
            },
            "&.Mui-disabled": {
              backgroundColor: theme.palette.surfaceContainerHighest,
              color: theme.palette.onSurfaceVariant,
            },
          })}
        >
          {getButtonContent()}
        </Button>
      </Stack>
    </Box>
  );
}

export function ManagementControlsCardShared({ props, slots }: Readonly<ManagementControlsCardSharedProps>) {
  const {
    currentStatus,
    isSubmitting,
    onCancel,
    selectedTeacherId,
    selectedNewStatus,
    saved,
    onSelectedTeacherIdChange,
    onSelectedNewStatusChange,
    onSubmitForm,
    labels,
    statusLabelId,
  } = props;
  const { CardContainer, StatusBadge, TeacherAutocomplete } = slots;

  return (
    <CardContainer sx={{ p: 3, boxShadow: theme => theme.palette.shadow.card }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, mb: 0.5 })}>
          {labels.controls.title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.controls.subtitle}
        </Typography>
      </Box>

      <Stack component="form" spacing={3} onSubmit={onSubmitForm}>
        <TeacherSelection
          selectedTeacherId={selectedTeacherId}
          onTeacherChange={onSelectedTeacherIdChange}
          labels={labels.controls}
          TeacherAutocomplete={TeacherAutocomplete}
        />
        <StatusUpdate
          currentStatus={currentStatus}
          selectedStatus={selectedNewStatus}
          onStatusChange={onSelectedNewStatusChange}
          labels={labels.controls}
          statusLabelId={statusLabelId}
          StatusBadge={StatusBadge}
        />
        <ActionButtons loading={isSubmitting} saved={saved} onCancel={onCancel} labels={labels.actions} />
      </Stack>
    </CardContainer>
  );
}
