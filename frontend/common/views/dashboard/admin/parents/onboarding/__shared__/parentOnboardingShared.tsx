import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import {
  MeetingConfigAlertShared,
  StatusBadgeShared,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared.parts";
import {
  MeetingConfigSectionShared,
  OnboardingFormSectionsShared,
  SubmitActionSectionShared,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared.sections";
import type { ParentOnboardingSharedOptions } from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared.types";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";
import { useRouter } from "@/shared/i18n/navigation";

export type { ParentOnboardingSharedOptions } from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared.types";

export function ParentOnboardingShared({
  form,
  register,
  onUploadAvatar,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  onSubmit,
  meetingConfigWarning,
  clearMeetingConfigWarning,
  meetingSetupHref,
  showSuccess,
  onDismissSuccess,
  labelsBySection,
  options,
}: Readonly<ParentOnboardingViewModel> & { readonly options: ParentOnboardingSharedOptions }): ReactNode {
  const t = labelsBySection.form;
  const tMeeting = labelsBySection.meeting.manager;
  const tJoin = labelsBySection.meeting.join;
  const router = useRouter();

  const meetingConfigAlert = (
    <MeetingConfigAlertShared
      meetingConfigWarning={meetingConfigWarning}
      meetingSetupHref={meetingSetupHref}
      failureMessage={tMeeting.postCreateFailure}
      setupLinkLabel={tJoin.setupLink}
      onClearWarning={clearMeetingConfigWarning}
      onVisitSetup={() => router.push(meetingSetupHref ?? "")}
      alertSx={options.alertSx}
    />
  );

  const statusBadge = <StatusBadgeShared bannerText={t.statusBanner} options={options} />;

  const formSections = (
    <OnboardingFormSectionsShared
      register={register}
      control={control}
      errors={errors}
      onUploadAvatar={onUploadAvatar}
      t={t}
      options={options}
    />
  );

  const meetingConfigSection = (
    <MeetingConfigSectionShared register={register} control={control} errors={errors} t={t} options={options} />
  );

  const submitSection = (
    <SubmitActionSectionShared
      isSubmitting={isSubmitting}
      processingLabel={t.actions.processing}
      signupLabel={t.actions.signup}
      privacyNote={t.privacyNote}
      options={options}
    />
  );

  return options.renderPageContainer(
    <>
      {meetingConfigAlert}
      {options.renderPageHeader(t.pageTitle, t.pageSubtitle, statusBadge)}
      <FormProvider {...form}>
        <Box
          component="form"
          onSubmit={e => {
            void handleSubmit(onSubmit)(e);
          }}
          sx={options.formSx}
        >
          {options.renderFormSections(formSections, meetingConfigSection)}
          {submitSection}
        </Box>
      </FormProvider>
      {options.renderSuccessSnackbar(showSuccess, t.actions.successMessage, onDismissSuccess)}
    </>
  );
}
