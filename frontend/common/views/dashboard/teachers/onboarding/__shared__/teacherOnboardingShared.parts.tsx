"use client";

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import {
  OnboardingPaymentMethodSection,
  UserEntityFieldsSection,
} from "@/frontend/common/components/onboarding/sections";
import type { CountrySelectProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  PrimaryPageActionProps,
  SectionPanelProps,
  TeacherOnboardingVmLabels,
} from "@/frontend/common/views/dashboard/teachers/onboarding/__shared__/teacherOnboardingShared.types";
import { MeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/MeetingConfigOnboardingSection";
import { OfficialDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/OfficialDetailsSection";
import { SalaryDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/SalaryDetailsSection";
import { TeacherExtensionSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/TeacherExtensionSection";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

interface FormSectionsProps {
  readonly register: TeacherOnboardingViewModel["register"];
  readonly control: TeacherOnboardingViewModel["control"];
  readonly errors: TeacherOnboardingViewModel["errors"];
  readonly labels: TeacherOnboardingVmLabels;
  readonly userEntityLabels: UserEntityOnboardingLabels;
  readonly onUploadAvatar: TeacherOnboardingViewModel["onUploadAvatar"];
  readonly SectionPanel: ComponentType<SectionPanelProps>;
  readonly CountrySelectComponent?: ComponentType<CountrySelectProps>;
}

export function FormSections({
  register,
  control,
  errors,
  labels,
  userEntityLabels,
  onUploadAvatar,
  SectionPanel,
  CountrySelectComponent,
}: Readonly<FormSectionsProps>) {
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
        <OfficialDetailsSection
          register={register}
          control={control}
          errors={errors}
          labels={labels}
          CountrySelectComponent={CountrySelectComponent}
        />
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

interface FormActionsProps {
  readonly isSubmitting: boolean;
  readonly labels: TeacherOnboardingVmLabels;
  readonly flexWrap: "wrap" | "nowrap";
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionProps>;
}

export function FormActions({ isSubmitting, labels, flexWrap, PrimaryPageAction }: Readonly<FormActionsProps>) {
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
