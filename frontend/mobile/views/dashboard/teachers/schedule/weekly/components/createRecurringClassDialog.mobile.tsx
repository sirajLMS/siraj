"use client";

import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { CreateRecurringClassDialogShared } from "@/frontend/common/components/ui/dialog/CreateRecurringClassDialogShared";
import type {
  CreateRecurringClassDialogShellSlotProps,
  CreateRecurringClassStudentSelectSlotProps,
  CreateRecurringClassTimezoneSelectSlotProps,
} from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import { QuotaAutocomplete } from "@/frontend/common/components/ui/input/quotaSelect";
import { useCreateRecurringClassDialogProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/useCreateRecurringClassDialogProps";
import type {
  CreateRecurringClassDialogProps,
  CreateRecurringClassDialogViewModel,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { TimezoneSelectMobile } from "@/frontend/mobile/components/ui/input/timezoneSelect";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { Translation, useAppTranslation } from "@/shared/locale";

function MobileDialogShell({
  onClose,
  title,
  children,
}: Readonly<Omit<CreateRecurringClassDialogShellSlotProps, "open">>) {
  const t = useAppTranslation(Translation.Common);
  return (
    <div>
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label={t.ariaClose}>
            <CloseOutlined />
          </IconButton>
          <Typography
            variant="titleLg"
            sx={{
              ml: 2,
              flex: 1,
              color: (theme: Theme) => theme.palette.onPrimary,
            }}
          >
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      {children}
    </div>
  );
}

function MobileStudentSelect({
  studentId,
  setStudentId,
  teacherId,
  isDialogOpen,
  mutationLoading,
  label,
}: Readonly<CreateRecurringClassStudentSelectSlotProps>) {
  return (
    <StudentAutocompleteMobile
      value={studentId ? { id: studentId, name: "" } : null}
      onChange={option => {
        setStudentId(option?.id ?? "");
      }}
      scope={{ primaryTeacherId: teacherId }}
      skip={!isDialogOpen || !teacherId}
      disabled={mutationLoading}
      label={label}
    />
  );
}

function MobileTimezoneSelect({
  value,
  onChangeAction,
  label,
  fullWidth,
  disabled,
}: Readonly<CreateRecurringClassTimezoneSelectSlotProps>) {
  return (
    <TimezoneSelectMobile
      value={value}
      onChangeAction={onChangeAction}
      label={label}
      fullWidth={fullWidth}
      disabled={disabled}
    />
  );
}

export function CreateRecurringClassDialogMobile({ teacherId, viewModel }: Readonly<CreateRecurringClassDialogProps>) {
  if (!viewModel) {
    return null;
  }
  return <CreateRecurringClassDialogMobileBody teacherId={teacherId} viewModel={viewModel} />;
}

function CreateRecurringClassDialogMobileBody({
  teacherId,
  viewModel,
}: {
  readonly teacherId: string;
  readonly viewModel: CreateRecurringClassDialogViewModel;
}) {
  return (
    <CreateRecurringClassDialogShared
      {...useCreateRecurringClassDialogProps(teacherId, viewModel)}
      slots={{
        DialogShell: MobileDialogShell,
        StudentSelect: MobileStudentSelect,
        TimezoneSelect: MobileTimezoneSelect,
        QuotaAutocomplete,
        layout: {
          fieldRowDirection: "column",
          dayItemDirection: "column",
          warningSx: { mt: 2 },
          timezoneWrapInBox: false,
        },
      }}
    />
  );
}
