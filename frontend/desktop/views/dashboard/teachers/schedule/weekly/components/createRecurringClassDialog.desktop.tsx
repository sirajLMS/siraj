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
import { ClassType, SchedulingMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import type {
  CreateRecurringClassDialogProps,
  CreateRecurringClassDialogViewModel,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

function isValidSchedulingMode(v: string): v is SchedulingMode {
  return (
    v === SchedulingMode.NumberOfClasses.toString() ||
    v === SchedulingMode.OnDemand.toString() ||
    v === SchedulingMode.Quota.toString()
  );
}

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
  const {
    formState: state,
    days,
    toggleDay,
    toggleTimeOverride,
    setTimeOverride,
    isDialogOpen,
    mutationLoading,
    meetingConfigWarning,
    completedClassInstanceId,
    closeDialog,
    handleSubmit,
    hasSessionCreateClass,
    labels: t,
    meetingLabels: tMeeting,
    recurringScheduleLabels: tRecurringSchedule,
    onGoToCreatedClass,
  } = viewModel;

  return (
    <CreateRecurringClassDialogShared
      teacherId={teacherId}
      state={state}
      days={days}
      toggleDay={toggleDay}
      toggleTimeOverride={toggleTimeOverride}
      setTimeOverride={setTimeOverride}
      isDialogOpen={isDialogOpen}
      mutationLoading={mutationLoading}
      meetingConfigWarning={meetingConfigWarning}
      completedClassInstanceId={completedClassInstanceId}
      closeDialog={closeDialog}
      handleSubmit={handleSubmit}
      hasSessionCreateClass={hasSessionCreateClass}
      labels={t}
      meetingLabels={tMeeting}
      recurringScheduleLabels={tRecurringSchedule}
      onGoToCreatedClass={onGoToCreatedClass}
      onClassTypeChange={(value, setClassType) => {
        const mapping: Record<string, ClassType> = {
          REGULAR: ClassType.Regular,
          TRIAL: ClassType.Trial,
          ADVANCE: ClassType.Advance,
        };
        const mapped = mapping[value];
        if (mapped) {
          setClassType(mapped);
        }
      }}
      onSchedulingModeChange={(value, setSchedulingMode) => {
        setSchedulingMode(isValidSchedulingMode(value) ? value : null);
      }}
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
