"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { FeesContractSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/FeesContractSection";
import { ParentExtensionSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentExtensionSection";
import { ParentMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentMeetingConfigOnboardingSection";
import { SocialCommsSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/SocialCommsSection";
import {
  OnboardingPaymentMethodSection,
  UserEntityFieldsSection,
} from "@/frontend/common/components/onboarding/sections";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  MeetingConfigAlertProps,
  OnboardingFormSectionsProps,
  SubmitActionSectionProps,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";
import {
  MobileFormSuccessSnackbar,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";

export function ParentOnboardingMobileView({
  form,
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  onSubmit,
  onUploadAvatar,
  meetingConfigWarning,
  clearMeetingConfigWarning,
  meetingSetupHref,
  showSuccess,
  onDismissSuccess,
  labelsBySection,
}: Readonly<ParentOnboardingViewModel>) {
  const t = labelsBySection.form;
  const tMeeting = labelsBySection.meeting.manager;
  const tJoin = labelsBySection.meeting.join;
  const router = useRouter();

  return (
    <MobilePageContainer>
      <MeetingConfigAlert
        meetingConfigWarning={meetingConfigWarning}
        meetingSetupHref={meetingSetupHref}
        onClearWarning={clearMeetingConfigWarning}
        onVisitSetup={() => router.push(meetingSetupHref ?? "")}
        failureMessage={tMeeting.postCreateFailure}
        setupLinkLabel={tJoin.setupLink}
      />

      <MobilePageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        edgeToEdge={false}
        actions={<StatusBadge bannerText={t.statusBanner} />}
      />

      <FormProvider {...form}>
        <Box
          component="form"
          onSubmit={e => {
            handleSubmit(onSubmit)(e);
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, md: 3 }, pb: 4 }}
        >
          <OnboardingFormSections
            register={register}
            control={control}
            errors={errors}
            onUploadAvatar={onUploadAvatar}
            t={t}
            meetingConfigLabels={{
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

          <SubmitActionSection
            isSubmitting={isSubmitting}
            processingLabel={t.actions.processing}
            signupLabel={t.actions.signup}
            privacyNote={t.privacyNote}
          />
        </Box>
      </FormProvider>

      <MobileFormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}

function MeetingConfigAlert({
  meetingConfigWarning,
  meetingSetupHref,
  failureMessage,
  setupLinkLabel,
  onClearWarning,
  onVisitSetup,
}: Readonly<MeetingConfigAlertProps>) {
  if (!meetingConfigWarning) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      onClose={onClearWarning}
      action={
        meetingSetupHref ? (
          <Button color="inherit" size="small" onClick={onVisitSetup}>
            {setupLinkLabel}
          </Button>
        ) : undefined
      }
      sx={{ mx: 2, mt: 1 }}
    >
      {failureMessage}
    </Alert>
  );
}

function StatusBadge({ bannerText }: Readonly<{ bannerText: string }>) {
  return (
    <Stack
      sx={theme => ({
        display: "flex",
        flexDirection: "row",
        gap: 1,
        alignItems: "center",
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.onPrimaryContainer,
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
      })}
    >
      <InfoOutlined sx={{ fontSize: 18 }} />
      <Typography variant="labelSm">{bannerText}</Typography>
    </Stack>
  );
}

function OnboardingFormSections({
  register,
  control,
  errors,
  onUploadAvatar,
  meetingConfigLabels,
  t,
}: Readonly<OnboardingFormSectionsProps & { readonly t: ParentOnboardingLabels }>) {
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);

  return (
    <>
      <MobileSectionPanel title={userEntityLabels.sectionTitle}>
        <UserEntityFieldsSection
          register={register}
          control={control}
          errors={errors}
          labels={userEntityLabels}
          onUploadAvatar={onUploadAvatar}
        />
      </MobileSectionPanel>
      <MobileSectionPanel title={t.sections.parentInfo}>
        <ParentExtensionSection register={register} control={control} errors={errors} labels={t} />
      </MobileSectionPanel>
      <SocialCommsSection register={register} control={control} />
      <FeesContractSection register={register} control={control} errors={errors} />
      <MobileSectionPanel title={t.fields.paymentMethod}>
        <OnboardingPaymentMethodSection
          control={control}
          errors={errors}
          direction={PaymentDirection.Payin}
          methodFieldName="payinMethod"
          addPaymentMethodLabel={t.sections.addPaymentMethod}
        />
      </MobileSectionPanel>
      <MobileSectionPanel title={meetingConfigLabels.sectionTitle}>
        <ParentMeetingConfigOnboardingSection
          register={register}
          control={control}
          errors={errors}
          labels={{
            sectionTitle: meetingConfigLabels.sectionTitle,
            optionalHint: meetingConfigLabels.optionalHint,
            fields: {
              meetingProvider: meetingConfigLabels.fields.meetingProvider,
              meetingUrl: meetingConfigLabels.fields.meetingUrl,
              meetingLabel: meetingConfigLabels.fields.meetingLabel,
            },
            placeholders: {
              meetingUrl: meetingConfigLabels.placeholders.meetingUrl,
              meetingLabel: meetingConfigLabels.placeholders.meetingLabel,
            },
          }}
        />
      </MobileSectionPanel>
    </>
  );
}

function SubmitActionSection({
  isSubmitting,
  processingLabel,
  signupLabel,
  privacyNote,
}: Readonly<SubmitActionSectionProps>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        backgroundColor: theme.palette.surfaceContainerLow,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 2,
      })}
    >
      <MobilePrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        fullWidth
        sx={{
          py: 2,
          fontWeight: "bold",
          letterSpacing: "0.1em",
        }}
      >
        {isSubmitting ? processingLabel : signupLabel}
      </MobilePrimaryPageAction>
      <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.secondary })}>
        {privacyNote}
      </Typography>
    </Box>
  );
}
