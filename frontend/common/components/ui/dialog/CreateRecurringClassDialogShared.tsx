"use client";

import {
  DialogFooterActions,
  DialogFormContent,
} from "@/frontend/common/components/ui/dialog/CreateRecurringClassDialogShared.parts";
import type { CreateRecurringClassDialogSharedComponentProps } from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import { OnDemandNoCreditsOutcome } from "@/frontend/common/graphql/generated/gql/graphql";

function isValidOnDemandNoCreditsOutcome(v: string): v is OnDemandNoCreditsOutcome {
  return (
    v === OnDemandNoCreditsOutcome.AutoAbsentNoCredits.toString() ||
    v === OnDemandNoCreditsOutcome.AutoCancel.toString() ||
    v === OnDemandNoCreditsOutcome.RemindOnly.toString()
  );
}

export function CreateRecurringClassDialogShared({
  teacherId,
  state,
  days,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  isDialogOpen,
  mutationLoading,
  meetingConfigWarning,
  completedClassInstanceId,
  subjects,
  subjectsLoading,
  meetingConfigValidation,
  closeDialog,
  handleSubmit,
  hasSessionCreateClass,
  labels: t,
  meetingLabels: tMeeting,
  recurringScheduleLabels: tRecurringSchedule,
  onGoToCreatedClass,
  onClassTypeChange,
  onSchedulingModeChange,
  onOndemandNoCreditsOutcomeChange,
  slots,
}: Readonly<CreateRecurringClassDialogSharedComponentProps>) {
  const { DialogShell, StudentSelect, TimezoneSelect, QuotaAutocomplete, layout } = slots;

  const handleClassTypeChange = (value: string) => {
    onClassTypeChange(value, state.setClassType);
  };
  const handleSchedulingModeChange = (value: string) => {
    onSchedulingModeChange(value, state.setSchedulingMode);
  };
  const handleOndemandNoCreditsOutcomeChange = (value: string) => {
    if (onOndemandNoCreditsOutcomeChange) {
      onOndemandNoCreditsOutcomeChange(value, state.setOndemandNoCreditsOutcome);
    } else {
      state.setOndemandNoCreditsOutcome(isValidOnDemandNoCreditsOutcome(value) ? value : null);
    }
  };

  return (
    <DialogShell open={isDialogOpen} onClose={closeDialog} title={t.dialogTitle}>
      <form onSubmit={handleSubmit}>
        <DialogFormContent
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
          subjects={subjects}
          subjectsLoading={subjectsLoading}
          meetingConfigValidation={meetingConfigValidation}
          t={t}
          tMeeting={tMeeting}
          tRecurringSchedule={tRecurringSchedule}
          onGoToCreatedClass={onGoToCreatedClass}
          StudentSelect={StudentSelect}
          TimezoneSelect={TimezoneSelect}
          QuotaAutocomplete={QuotaAutocomplete}
          layout={layout}
          onClassTypeChange={handleClassTypeChange}
          onSchedulingModeChange={handleSchedulingModeChange}
          onOndemandNoCreditsOutcomeChange={handleOndemandNoCreditsOutcomeChange}
        />
        <DialogFooterActions
          closeDialog={closeDialog}
          hasSessionCreateClass={hasSessionCreateClass}
          mutationLoading={mutationLoading}
          t={t}
        />
      </form>
    </DialogShell>
  );
}
