"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { UserIdentityFields } from "@/frontend/common/components/onboarding/sections";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import type { StaffOnboardingLabels } from "@/shared/locale";

interface Props {
  readonly labels: StaffOnboardingLabels;
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export function StaffInfoSection({ labels, register, control, errors, onUploadAvatar }: Readonly<Props>) {
  const t = labels;

  const translate = {
    fields: {
      fullName: t.fields.fullName,
      email: t.fields.email,
      password: t.fields.password,
      phone: t.fields.phone,
      avatar: t.fields.avatar,
    },
    placeholders: {
      fullName: t.placeholders.fullName,
      email: t.placeholders.email,
      password: t.placeholders.password,
      phone: t.placeholders.phone,
    },
    validation: t.validation,
  };

  return (
    <SectionPanel title={t.sections.staffInfo}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <UserIdentityFields
          register={register}
          control={control}
          errors={errors}
          translate={translate}
          onUploadAvatar={onUploadAvatar}
        />
      </Grid>
    </SectionPanel>
  );
}
