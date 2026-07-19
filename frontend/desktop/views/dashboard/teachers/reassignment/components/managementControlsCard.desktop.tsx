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
import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
import { ALLOWED_TARGET_STATUSES } from "@/frontend/common/utils/student-status-transitions";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopBaseCard } from "@/frontend/desktop/components/ui/card";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { outlinedInputSx } from "@/frontend/desktop/components/ui/form/field/formFieldStyles.desktop";
import { useAppTranslation } from "@/shared/locale";

function TeacherSelection({
  selectedTeacherId,
  onTeacherChange,
}: Readonly<{
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
}>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.controls;
  const [selectedTeacher, setSelectedTeacher] = useState<PersonOption | null>(null);
  const value =
    selectedTeacher ?? resolvePersonOption(selectedTeacherId, [], selectedTeacher);

  return (
    <Box>
      <TeacherAutocompleteDesktop
        value={value}
        onChange={(next: PersonOption | null) => {
          setSelectedTeacher(next);
          onTeacherChange(next?.id ?? "");
        }}
        label={t.assignTeacher}
        placeholder={t.assignTeacherPlaceholder}
      />
      <FormHelperText sx={{ fontStyle: "italic", mt: 1 }}>{t.teacherAvailabilityNotice}</FormHelperText>
    </Box>
  );
}

function StatusUpdate({
  currentStatus,
  selectedStatus,
  onStatusChange,
}: Readonly<{
  currentStatus: StudentStatus;
  selectedStatus: StudentStatus | "";
  onStatusChange: (status: StudentStatus | "") => void;
}>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.controls;

  const statusKey = STUDENT_STATUS_TO_ACCOUNT_STATUS[currentStatus] ?? currentStatus;

  const allowedTargets = ALLOWED_TARGET_STATUSES[currentStatus] ?? [];

  return (
    <Box>
      <FormControl fullWidth sx={outlinedInputSx}>
        <InputLabel id="teacher-reassignment-status-label-desktop" shrink>
          {t.statusUpdate}
        </InputLabel>
        <Select
          value={selectedStatus}
          labelId="teacher-reassignment-status-label-desktop"
          label={t.statusUpdate}
          onChange={e => {
            const val = e.target.value;
            if (typeof val === "string") onStatusChange(val);
          }}
        >
          {allowedTargets.map(status => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.currentStatus("").replace(":", "").trim()}:
        </Typography>
        <DesktopStatusBadge category="studentAccount" status={statusKey} label={currentStatus} />
      </Box>
    </Box>
  );
}

function ActionButtons({
  loading,
  saved,
  onCancel,
}: Readonly<{
  loading: boolean;
  saved: boolean;
  onCancel: () => void;
}>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.actions;

  const getButtonContent = (): React.ReactNode => {
    if (loading) return <CircularProgress size={20} color="inherit" />;
    if (saved) {
      return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
          <CheckCircleOutlined sx={{ fontSize: 18 }} />
          <Typography variant="buttonText">{t.saved}</Typography>
        </Stack>
      );
    }
    return <Typography variant="buttonText">{t.submit}</Typography>;
  };

  return (
    <Box
      sx={theme => ({
        pt: 4,
        borderTop: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      })}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={theme => ({ alignItems: "center", color: theme.palette.onSurfaceVariant })}
      >
        <InfoOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="labelSm">{t.info}</Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={theme => ({
            flex: 1,
            minWidth: 120,
            py: 1.5,
            fontWeight: 700,
            color: theme.palette.onSurfaceVariant,
            borderColor: theme.palette.border.main,
            "&:hover": {
              borderColor: theme.palette.border.main,
              backgroundColor: theme.palette.surfaceContainerLow,
            },
          })}
        >
          {t.cancel}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || saved}
          sx={theme => ({
            flex: 1,
            minWidth: 160,
            py: 1.5,
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

export function ManagementControlsCardDesktop({
  currentStatus,
  studentId: _studentId,
  version: _version,
  isSubmitting,
  onReassign: _onReassign,
  onStatusChange: _onStatusChange,
  onCancel,
  selectedTeacherId,
  selectedNewStatus,
  saved,
  onSelectedTeacherIdChange,
  onSelectedNewStatusChange,
  onSubmitForm,
}: Readonly<ManagementControlsCardProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment;

  return (
    <DesktopBaseCard sx={{ p: 4, boxShadow: theme => theme.palette.shadow.card }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, mb: 1 })}>
          {t.controls.title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.controls.subtitle}
        </Typography>
      </Box>

      <Stack component="form" spacing={4} onSubmit={onSubmitForm}>
        <TeacherSelection
          selectedTeacherId={selectedTeacherId}
          onTeacherChange={onSelectedTeacherIdChange}
        />
        <StatusUpdate
          currentStatus={currentStatus}
          selectedStatus={selectedNewStatus}
          onStatusChange={onSelectedNewStatusChange}
        />
        <ActionButtons loading={isSubmitting} saved={saved} onCancel={onCancel} />
      </Stack>
    </DesktopBaseCard>
  );
}
