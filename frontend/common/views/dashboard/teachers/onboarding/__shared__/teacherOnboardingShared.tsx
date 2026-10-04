"use client";

import { Box, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import type { CountrySelectProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import {
  FormActions,
  FormSections,
} from "@/frontend/common/views/dashboard/teachers/onboarding/__shared__/teacherOnboardingShared.parts";
import type {
  PageHeaderProps,
  PrimaryPageActionProps,
  SectionPanelProps,
  SnackbarProps,
} from "@/frontend/common/views/dashboard/teachers/onboarding/__shared__/teacherOnboardingShared.types";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

export interface TeacherOnboardingSharedOptions {
  readonly PageContainer: ComponentType<{ children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderProps>;
  readonly SectionPanel: ComponentType<SectionPanelProps>;
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionProps>;
  readonly FormSuccessSnackbar: ComponentType<SnackbarProps>;
  readonly FormErrorSnackbar?: ComponentType<SnackbarProps>;
  readonly CountrySelectComponent?: ComponentType<CountrySelectProps>;
  readonly userEntityLabels: UserEntityOnboardingLabels;
  readonly formActionsFlexWrap?: "wrap" | "nowrap";
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
    CountrySelectComponent,
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
            CountrySelectComponent={CountrySelectComponent}
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
