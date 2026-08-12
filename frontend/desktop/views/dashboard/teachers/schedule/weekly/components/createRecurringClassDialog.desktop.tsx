"use client";

import { Dialog, DialogTitle } from "@mui/material";
import { CreateRecurringClassDialogShared } from "@/frontend/common/components/ui/dialog/CreateRecurringClassDialogShared";
import type {
  CreateRecurringClassDialogShellSlotProps,
  CreateRecurringClassStudentSelectSlotProps,
  CreateRecurringClassTimezoneSelectSlotProps,
} from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { buildCreateRecurringClassDialogProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/createRecurringClassDialogProps";
import type {
  CreateRecurringClassDialogProps,
  CreateRecurringClassDialogViewModel,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

function DesktopDialogShell({ open, onClose, title, children }: Readonly<CreateRecurringClassDialogShellSlotProps>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {children}
    </Dialog>
  );
}

function DesktopStudentSelect({
  studentId,
  setStudentId,
  teacherId,
  isDialogOpen,
  mutationLoading,
  label,
}: Readonly<CreateRecurringClassStudentSelectSlotProps>) {
  return (
    <StudentAutocompleteDesktop
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

function DesktopTimezoneSelect({
  value,
  onChangeAction,
  label,
  fullWidth,
  disabled,
}: Readonly<CreateRecurringClassTimezoneSelectSlotProps>) {
  return (
    <TimezoneSelect
      value={value ? toGraphqlIanaTimezone(value) : null}
      onChangeAction={(timezone: IanaTimezone | null) => {
        onChangeAction(timezone ? fromGraphqlIanaTimezone(timezone) : "");
      }}
      label={label}
      fullWidth={fullWidth}
      disabled={disabled}
    />
  );
}

export function CreateRecurringClassDialogDesktop({ teacherId, viewModel }: Readonly<CreateRecurringClassDialogProps>) {
  if (!viewModel) {
    return null;
  }
  return <CreateRecurringClassDialogDesktopBody teacherId={teacherId} viewModel={viewModel} />;
}

function CreateRecurringClassDialogDesktopBody({
  teacherId,
  viewModel,
}: {
  readonly teacherId: string;
  readonly viewModel: CreateRecurringClassDialogViewModel;
}) {
  return (
    <CreateRecurringClassDialogShared
      {...buildCreateRecurringClassDialogProps(teacherId, viewModel)}
      slots={{
        DialogShell: DesktopDialogShell,
        StudentSelect: DesktopStudentSelect,
        TimezoneSelect: DesktopTimezoneSelect,
        layout: {
          fieldRowDirection: "row",
          dayItemDirection: "row",
          timezoneWrapInBox: true,
        },
      }}
    />
  );
}
