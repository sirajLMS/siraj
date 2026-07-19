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
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ALLOWED_TARGET_STATUSES } from "@/frontend/common/utils/student-status-transitions";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { useAppTranslation } from "@/shared/locale";

function TeacherSelection({
  teachers,
  selectedTeacherId,
  onTeacherChange,
}: Readonly<{
  teachers: readonly { readonly id: string; readonly name: string }[];
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
}>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.controls;
  return (
    <Box>
      <FormControl fullWidth size="small" sx={outlinedInputSx}>
        <InputLabel id="teacher-reassignment-teacher-label-mobile" shrink>
          {t.assignTeacher}
        </InputLabel>
        <Select
          displayEmpty
          value={selectedTeacherId}
          labelId="teacher-reassignment-teacher-label-mobile"
          label={t.assignTeacher}
          onChange={e => {
            const val = e.target.value;
            if (typeof val === "string") onTeacherChange(val);
          }}
        >
          <MenuItem value="" disabled>
            {t.assignTeacherPlaceholder}
          </MenuItem>
          {teachers.map(teacher => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ fontStyle: "italic" }}>{t.teacherAvailabilityNotice}</FormHelperText>
      </FormControl>
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
      <FormControl fullWidth size="small" sx={outlinedInputSx}>
        <InputLabel id="teacher-reassignment-status-label-mobile" shrink>
          {t.statusUpdate}
        </InputLabel>
        <Select
          value={selectedStatus}
          labelId="teacher-reassignment-status-label-mobile"
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
      <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.currentStatus("").replace(":", "").trim()}:
        </Typography>
        <MobileStatusBadge category="studentAccount" status={statusKey} label={currentStatus} />
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
    if (loading) return <CircularProgress size={18} color="inherit" />;
    if (saved) {
      return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
          <CheckCircleOutlined sx={{ fontSize: 16 }} />
          <Typography variant="labelSm">{t.saved}</Typography>
        </Stack>
      );
    }
    return <Typography variant="labelSm">{t.submit}</Typography>;
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
        <Typography variant="labelSm">{t.info}</Typography>
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
          {t.cancel}
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

export function ManagementControlsCardMobile({
  teachers,
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
    <MobileBaseCard sx={{ p: 3, boxShadow: theme => theme.palette.shadow.card }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, mb: 0.5 })}>
          {t.controls.title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.controls.subtitle}
        </Typography>
      </Box>

      <Stack component="form" spacing={3} onSubmit={onSubmitForm}>
        <TeacherSelection
          teachers={teachers}
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
    </MobileBaseCard>
  );
}
