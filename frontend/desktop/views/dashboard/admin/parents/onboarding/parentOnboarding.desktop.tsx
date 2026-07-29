"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { FeesContractSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/FeesContractSection";
import { ParentExtensionSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentExtensionSection";
import { ParentMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentMeetingConfigOnboardingSection";
import { SocialCommsSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/SocialCommsSection";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";
import {
  OnboardingPaymentMethodSection,
  UserEntityFieldsSection,
} from "@/frontend/common/components/onboarding/sections";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  DesktopFormSuccessSnackbar,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";

type ParentOnboardingFormSectionsProps = Pick<
  ParentOnboardingViewModel,
  "register" | "control" | "errors" | "onUploadAvatar"
>;

function ParentOnboardingFormSections({
  register,
  control,
  errors,
  onUploadAvatar,
  t,
}: ParentOnboardingFormSectionsProps & { readonly t: ParentOnboardingLabels }) {
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);

  return (
    <>
      <DesktopSectionPanel title={userEntityLabels.sectionTitle}>
        <UserEntityFieldsSection
          register={register}
          control={control}
          errors={errors}
          labels={userEntityLabels}
          onUploadAvatar={onUploadAvatar}
        />
      </DesktopSectionPanel>
      <DesktopSectionPanel title={t.sections.parentInfo}>
        <ParentExtensionSection register={register} control={control} errors={errors} labels={t} />
      </DesktopSectionPanel>
      <SocialCommsSection register={register} control={control} />
      <FeesContractSection register={register} control={control} errors={errors} />
      <DesktopSectionPanel title={t.fields.paymentMethod}>
        <OnboardingPaymentMethodSection
          control={control}
          errors={errors}
          direction={PaymentDirection.Payin}
          methodFieldName="payinMethod"
          addPaymentMethodLabel={t.sections.addPaymentMethod}
        />
      </DesktopSectionPanel>
    </>
  );
}

type MeetingConfigSectionProps = Pick<ParentOnboardingViewModel, "register" | "control" | "errors"> & {
  readonly t: ParentOnboardingLabels;
};

function MeetingConfigSection({ register, control, errors, t }: MeetingConfigSectionProps) {
  return (
    <DesktopSectionPanel title={t.sections.meetingConfig}>
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
    </DesktopSectionPanel>
  );
}

type SubmitActionsProps = {
  readonly isSubmitting: boolean;
  readonly t: ParentOnboardingLabels;
};

function SubmitActions({ isSubmitting, t }: SubmitActionsProps) {
  return (
    <Box
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.surfaceContainerLow,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
      })}
    >
      <DesktopPrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        sx={{
          px: 6,
          py: 2,
          fontWeight: "bold",
          letterSpacing: "0.1em",
          minWidth: 200,
        }}
      >
        {isSubmitting ? t.actions.processing : t.actions.signup}
      </DesktopPrimaryPageAction>
      <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.secondary })}>
        {t.privacyNote}
      </Typography>
    </Box>
  );
}

type MeetingConfigAlertProps = Pick<
  ParentOnboardingViewModel,
  "meetingConfigWarning" | "clearMeetingConfigWarning" | "meetingSetupHref" | "labelsBySection"
>;

function useMeetingConfigAlert(props: MeetingConfigAlertProps) {
  const router = useRouter();
  const { meetingConfigWarning, clearMeetingConfigWarning, meetingSetupHref, labelsBySection } = props;
  const tMeeting = labelsBySection.meeting.manager;
  const tJoin = labelsBySection.meeting.join;
  if (!meetingConfigWarning) {
    return null;
  }
  return (
    <Alert
      severity="warning"
      onClose={clearMeetingConfigWarning}
      action={
        meetingSetupHref ? (
          <Button color="inherit" size="small" onClick={() => router.push(meetingSetupHref)}>
            {tJoin.setupLink}
          </Button>
        ) : undefined
      }
      sx={{ mb: 2 }}
    >
      {tMeeting.postCreateFailure}
    </Alert>
  );
}

type StatusBannerActionProps = {
  readonly t: ParentOnboardingLabels;
};

function useStatusBannerAction({ t }: StatusBannerActionProps) {
  return (
    <Stack
      sx={theme => ({
        display: "flex",
        flexDirection: "row",
        gap: 2,
        alignItems: "center",
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.onPrimaryContainer,
        px: 2,
        py: 1,
        borderRadius: 2,
      })}
    >
      <InfoOutlined />
      <Typography variant="labelMd">{t.statusBanner}</Typography>
    </Stack>
  );
}

type ParentOnboardingFormProps = Pick<
  ParentOnboardingViewModel,
  "form" | "register" | "control" | "errors" | "onUploadAvatar" | "handleSubmit" | "onSubmit" | "isSubmitting"
> & {
  readonly t: ParentOnboardingLabels;
};

function useParentOnboardingForm(props: ParentOnboardingFormProps) {
  const { form, register, control, errors, onUploadAvatar, handleSubmit, onSubmit, isSubmitting, t } = props;
  return (
    <FormProvider {...form}>
      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <ParentOnboardingFormSections
          register={register}
          control={control}
          errors={errors}
          onUploadAvatar={onUploadAvatar}
          t={t}
        />
        <MeetingConfigSection register={register} control={control} errors={errors} t={t} />
        <SubmitActions isSubmitting={isSubmitting} t={t} />
      </Box>
    </FormProvider>
  );
}

export function ParentOnboardingDesktopView({
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
}: Readonly<ParentOnboardingViewModel>) {
  const t = labelsBySection.form;
  const meetingConfigAlert = useMeetingConfigAlert({
    meetingConfigWarning,
    clearMeetingConfigWarning,
    meetingSetupHref,
    labelsBySection,
  });
  const statusBannerAction = useStatusBannerAction({ t });
  const parentOnboardingForm = useParentOnboardingForm({
    form,
    register,
    onUploadAvatar,
    control,
    errors,
    handleSubmit,
    onSubmit,
    isSubmitting,
    t,
  });

  return (
    <DesktopPageContainer>
      {meetingConfigAlert}
      <DesktopPageHeader title={t.pageTitle} subtitle={t.pageSubtitle} actions={statusBannerAction} />
      {parentOnboardingForm}
      <DesktopFormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
    </DesktopPageContainer>
  );
}
