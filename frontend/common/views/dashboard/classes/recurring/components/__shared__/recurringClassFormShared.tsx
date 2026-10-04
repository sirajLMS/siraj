"use client";

import { RecurringClassFormActionsShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared.parts";
import { StyledScrollableFormBody } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared.styled";
import type { RecurringClassFormSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared.types";
import type { BaseRecurringClassFormProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export type { RecurringClassFormSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared.types";

export function RecurringClassFormShared({
  register,
  errors,
  watch,
  setValue,
  control,
  handleSubmit,
  isSubmitting,
  showSuccess,
  meetingConfigWarning = false,
  meetingConfigWarningMessage,
  goToClassLabel,
  onGoToCreatedClass,
  formLabels,
  onSubmit,
  subjects,
  subjectsLoading,
  meetingConfig,
  meetingConfigValidation,
  onMeetingConfigChangeAction,
  options,
}: BaseRecurringClassFormProps & {
  readonly showSuccess?: boolean;
  readonly options: RecurringClassFormSharedOptions;
}) {
  const FieldsComponent = options.fieldsComponent;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        void handleSubmit(onSubmit)(e);
      }}
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <StyledScrollableFormBody paddingScale={options.scrollableBodyPaddingScale}>
        <FieldsComponent
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          control={control}
          isSubmitting={isSubmitting}
          labels={formLabels}
          subjects={subjects}
          subjectsLoading={subjectsLoading}
          meetingConfig={meetingConfig}
          meetingConfigValidation={meetingConfigValidation}
          onMeetingConfigChangeAction={onMeetingConfigChangeAction}
        />

        <RecurringClassFormActionsShared
          labels={formLabels}
          isSubmitting={isSubmitting}
          showSuccess={showSuccess}
          meetingConfigWarning={meetingConfigWarning}
          meetingConfigWarningMessage={meetingConfigWarningMessage}
          goToClassLabel={goToClassLabel}
          onGoToCreatedClass={onGoToCreatedClass}
          options={options}
        />
      </StyledScrollableFormBody>
    </form>
  );
}
