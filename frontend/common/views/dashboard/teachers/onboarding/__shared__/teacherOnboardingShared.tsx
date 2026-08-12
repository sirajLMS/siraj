"use client";

import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType, ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import {
  OnboardingPaymentMethodSection,
  UserEntityFieldsSection,
} from "@/frontend/common/components/onboarding/sections";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/MeetingConfigOnboardingSection";
import { OfficialDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/OfficialDetailsSection";
import { SalaryDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/SalaryDetailsSection";
import { TeacherExtensionSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/TeacherExtensionSection";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly actions?: ReactNode;
}
interface SectionPanelProps {
  readonly title: string;
  readonly children: ReactNode;
}
interface PrimaryPageActionProps {
  readonly type?: "submit" | "reset" | "button";
  readonly variant?: "text" | "outlined" | "contained";
  readonly disabled?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}
interface SnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

export interface TeacherOnboardingSharedOptions {
  readonly PageContainer: ComponentType<{ children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderProps>;
  readonly SectionPanel: ComponentType<SectionPanelProps>;
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionProps>;
  readonly FormSuccessSnackbar: ComponentType<SnackbarProps>;
  readonly FormErrorSnackbar?: ComponentType<SnackbarProps>;
  readonly userEntityLabels: UserEntityOnboardingLabels;
  readonly formActionsFlexWrap?: "wrap" | "nowrap";
}

type VmLabels = TeacherOnboardingViewModel["labels"];

function FormSections({
  register,
  control,
  errors,
  labels,
  userEntityLabels,
  onUploadAvatar,
  SectionPanel,
}: Readonly<{
  register: TeacherOnboardingViewModel["register"];
  control: TeacherOnboardingViewModel["control"];
  errors: TeacherOnboardingViewModel["errors"];
  labels: VmLabels;
  userEntityLabels: UserEntityOnboardingLabels;
  onUploadAvatar: TeacherOnboardingViewModel["onUploadAvatar"];
  SectionPanel: ComponentType<SectionPanelProps>;
}>) {
  return (
    <>
      <SectionPanel title={userEntityLabels.sectionTitle}>
        <UserEntityFieldsSection
          control={control}
          errors={errors}
          labels={userEntityLabels}
          onUploadAvatar={onUploadAvatar}
          phoneRequired
        />
      </SectionPanel>
      <SectionPanel title={labels.sections.teacherInfo}>
        <TeacherExtensionSection register={register} control={control} errors={errors} labels={labels} />
      </SectionPanel>
      <SectionPanel title={labels.sections.officialDetails}>
        <OfficialDetailsSection register={register} control={control} errors={errors} labels={labels} />
      </SectionPanel>
      <SectionPanel title={labels.sections.salaryDetails}>
        <SalaryDetailsSection register={register} control={control} errors={errors} labels={labels} />
      </SectionPanel>
      <SectionPanel title={labels.sections.paymentMethod}>
        <OnboardingPaymentMethodSection
          control={control}
          errors={errors}
          direction={PaymentDirection.Payout}
          methodFieldName="payoutMethod"
          addPaymentMethodLabel={labels.sections.addPaymentMethod}
        />
      </SectionPanel>
      <SectionPanel title={labels.sections.meetingConfig}>
        <MeetingConfigOnboardingSection
          register={register}
          control={control}
          errors={errors}
          labels={{
            fields: {
              meetingProvider: labels.fields.meetingProvider,
              meetingUrl: labels.fields.meetingUrl,
              meetingLabel: labels.fields.meetingLabel,
            },
            placeholders: {
              meetingUrl: labels.placeholders.meetingUrl,
              meetingLabel: labels.placeholders.meetingLabel,
            },
            optionalHint: labels.optionalHint,
          }}
        />
      </SectionPanel>
    </>
  );
}

const SUBMIT_SX: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.status.active,
  color: theme.palette.status.onActive,
  "&:hover": { backgroundColor: theme.palette.status.active },
  px: 5,
  py: 1.5,
  fontWeight: 700,
  letterSpacing: "0.1em",
});

const RESET_SX: SxProps<Theme> = theme => ({
  color: theme.palette.text.secondary,
  fontWeight: 700,
  letterSpacing: "0.1em",
});

function FormActions({
  isSubmitting,
  labels,
  flexWrap,
  PrimaryPageAction,
}: Readonly<{
  isSubmitting: boolean;
  labels: VmLabels;
  flexWrap: "wrap" | "nowrap";
  PrimaryPageAction: ComponentType<PrimaryPageActionProps>;
}>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap }}>
      <PrimaryPageAction type="submit" disabled={isSubmitting} sx={SUBMIT_SX}>
        {isSubmitting ? labels.actions.proceeding : labels.actions.signup}
      </PrimaryPageAction>
      <PrimaryPageAction type="reset" variant="text" sx={RESET_SX}>
        {labels.actions.cancel}
      </PrimaryPageAction>
    </Box>
  );
}

export function TeacherOnboardingShared({
  vm,
  options,
}: Readonly<{ vm: TeacherOnboardingViewModel; options: TeacherOnboardingSharedOptions }>) {
  const {
    form,
    register,
    onUploadAvatar,
    control,
    errors,
    handleSubmit,
    isSubmitting,
    showSuccess,
    submitError,
    labels,
    onSubmit,
    onDismissSuccess,
    onDismissError,
  } = vm;
  const {
    PageContainer,
    PageHeader,
    SectionPanel,
    PrimaryPageAction,
    FormSuccessSnackbar,
    FormErrorSnackbar,
    userEntityLabels,
    formActionsFlexWrap = "nowrap",
  } = options;
  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <Typography
            variant="labelUppercase"
            sx={theme => ({ color: theme.palette.error.main, display: { xs: "none", md: "block" } })}
          >
            {labels.mandatoryFields}
          </Typography>
        }
      />
      <FormProvider {...form}>
        <Box
          component="form"
          onSubmit={e => {
            void handleSubmit(onSubmit)(e);
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 4, pb: 12 }}
        >
          <FormSections
            register={register}
            control={control}
            errors={errors}
            labels={labels}
            userEntityLabels={userEntityLabels}
            onUploadAvatar={onUploadAvatar}
            SectionPanel={SectionPanel}
          />
          <FormActions
            isSubmitting={isSubmitting}
            labels={labels}
            flexWrap={formActionsFlexWrap}
            PrimaryPageAction={PrimaryPageAction}
          />
        </Box>
      </FormProvider>
      <FormSuccessSnackbar open={showSuccess} message={labels.actions.successMessage} onClose={onDismissSuccess} />
      {FormErrorSnackbar ? (
        <FormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
      ) : null}
    </PageContainer>
  );
}
