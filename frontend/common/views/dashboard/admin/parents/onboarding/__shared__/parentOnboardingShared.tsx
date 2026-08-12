import { InfoOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import {
  OnboardingPaymentMethodSection,
  UserEntityFieldsSection,
} from "@/frontend/common/components/onboarding/sections";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { FeesContractSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/FeesContractSection";
import { ParentExtensionSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentExtensionSection";
import { ParentMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentMeetingConfigOnboardingSection";
import { SocialCommsSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/SocialCommsSection";
import type {
  MeetingConfigAlertProps,
  OnboardingFormSectionsProps,
  SubmitActionSectionProps,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";

export interface ParentOnboardingSharedOptions {
  readonly formGap: number;
  readonly formSx: Record<string, unknown>;
  readonly alertSx: SxProps<Theme>;
  readonly statusBadgeSx: SxProps<Theme>;
  readonly statusBadgeIconSize: number;
  readonly statusBadgeTypographyVariant: "labelMd" | "labelSm";
  readonly submitBoxSx: SxProps<Theme>;
  readonly submitButtonSx: SxProps<Theme>;
  readonly renderPageContainer: (children: ReactNode) => ReactNode;
  readonly renderPageHeader: (title: string, subtitle: string, actions: ReactNode) => ReactNode;
  readonly renderSectionPanel: (title: string, children: ReactNode) => ReactNode;
  readonly renderSubmitButton: (props: {
    readonly isSubmitting: boolean;
    readonly processingLabel: string;
    readonly signupLabel: string;
  }) => ReactNode;
  readonly renderSuccessSnackbar: (open: boolean, message: string, onClose: () => void) => ReactNode;
  readonly renderFormSections: (sections: ReactNode, meetingConfigSection: ReactNode) => ReactNode;
}

export function MeetingConfigAlertShared({
  meetingConfigWarning,
  meetingSetupHref,
  failureMessage,
  setupLinkLabel,
  onClearWarning,
  onVisitSetup,
  alertSx,
}: Readonly<MeetingConfigAlertProps> & { readonly alertSx: SxProps<Theme> }): ReactNode {
  if (!meetingConfigWarning) return null;

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
      sx={alertSx}
    >
      {failureMessage}
    </Alert>
  );
}

export function StatusBadgeShared({
  bannerText,
  options,
}: {
  readonly bannerText: string;
  readonly options: ParentOnboardingSharedOptions;
}): ReactNode {
  return (
    <Stack sx={options.statusBadgeSx}>
      <InfoOutlined sx={{ fontSize: options.statusBadgeIconSize }} />
      <Typography variant={options.statusBadgeTypographyVariant}>{bannerText}</Typography>
    </Stack>
  );
}

function OnboardingFormSectionsShared({
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

function MeetingConfigSectionShared({
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

function SubmitActionSectionShared({
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

  const meetingConfigAlert = MeetingConfigAlertShared({
    meetingConfigWarning,
    meetingSetupHref,
    failureMessage: tMeeting.postCreateFailure,
    setupLinkLabel: tJoin.setupLink,
    onClearWarning: clearMeetingConfigWarning,
    onVisitSetup: () => router.push(meetingSetupHref ?? ""),
    alertSx: options.alertSx,
  });

  const statusBadge = StatusBadgeShared({ bannerText: t.statusBanner, options });

  const formSections = OnboardingFormSectionsShared({
    register,
    control,
    errors,
    onUploadAvatar,
    t,
    options,
  });

  const meetingConfigSection = MeetingConfigSectionShared({
    register,
    control,
    errors,
    t,
    options,
  });

  const submitSection = SubmitActionSectionShared({
    isSubmitting,
    processingLabel: t.actions.processing,
    signupLabel: t.actions.signup,
    privacyNote: t.privacyNote,
    options,
  });

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
