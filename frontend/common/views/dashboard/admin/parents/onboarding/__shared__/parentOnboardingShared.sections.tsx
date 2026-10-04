import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  OnboardingPaymentMethodSection,
  UserEntityFieldsSection,
} from "@/frontend/common/components/onboarding/sections";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ParentOnboardingSharedOptions } from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared.types";
import { FeesContractSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/FeesContractSection";
import { ParentExtensionSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentExtensionSection";
import { ParentMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentMeetingConfigOnboardingSection";
import { SocialCommsSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/SocialCommsSection";
import type {
  OnboardingFormSectionsProps,
  SubmitActionSectionProps,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";

export function OnboardingFormSectionsShared({
  register,
  control,
  errors,
  onUploadAvatar,
  t,
  options,
}: Readonly<Omit<OnboardingFormSectionsProps, "meetingConfigLabels">> & {
  readonly t: ParentOnboardingLabels;
  readonly options: ParentOnboardingSharedOptions;
}): ReactNode {
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);

  return (
    <>
      {options.renderSectionPanel(
        userEntityLabels.sectionTitle,
        <UserEntityFieldsSection
          control={control}
          errors={errors}
          labels={userEntityLabels}
          onUploadAvatar={onUploadAvatar}
        />
      )}
      {options.renderSectionPanel(
        t.sections.parentInfo,
        <ParentExtensionSection register={register} control={control} errors={errors} labels={t} />
      )}
      <SocialCommsSection register={register} control={control} />
      <FeesContractSection register={register} control={control} errors={errors} />
      {options.renderSectionPanel(
        t.fields.paymentMethod,
        <OnboardingPaymentMethodSection
          control={control}
          errors={errors}
          direction={PaymentDirection.Payin}
          methodFieldName="payinMethod"
          addPaymentMethodLabel={t.sections.addPaymentMethod}
        />
      )}
    </>
  );
}

export function MeetingConfigSectionShared({
  register,
  control,
  errors,
  t,
  options,
}: {
  readonly register: ParentOnboardingViewModel["register"];
  readonly control: ParentOnboardingViewModel["control"];
  readonly errors: ParentOnboardingViewModel["errors"];
  readonly t: ParentOnboardingLabels;
  readonly options: ParentOnboardingSharedOptions;
}): ReactNode {
  return options.renderSectionPanel(
    t.sections.meetingConfig,
    <ParentMeetingConfigOnboardingSection
      register={register}
      control={control}
      errors={errors}
      labels={{
        sectionTitle: t.sections.meetingConfig,
        optionalHint: t.optionalHint,
        fields: {
          meetingProvider: t.fields.meetingProvider,
          meetingUrl: t.fields.meetingUrl,
          meetingLabel: t.fields.meetingLabel,
        },
        placeholders: {
          meetingUrl: t.placeholders.meetingUrl,
          meetingLabel: t.placeholders.meetingLabel,
        },
      }}
    />
  );
}

export function SubmitActionSectionShared({
  isSubmitting,
  processingLabel,
  signupLabel,
  privacyNote,
  options,
}: Readonly<SubmitActionSectionProps> & {
  readonly options: ParentOnboardingSharedOptions;
}): ReactNode {
  return (
    <Box sx={options.submitBoxSx}>
      {options.renderSubmitButton({ isSubmitting, processingLabel, signupLabel })}
      <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.secondary })}>
        {privacyNote}
      </Typography>
    </Box>
  );
}
