"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { OnboardingSectionTranslations } from "@/frontend/common/components/onboarding/sections";
import { UserIdentityFields } from "@/frontend/common/components/onboarding/sections";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

interface StudentIdentityLabels {
  readonly name: string;
  readonly namePlaceholder: string;
  readonly nameMinLength: string;
  readonly avatar: string;
}

interface StudentIdentityFieldsProps {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly labels: StudentIdentityLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

function toSectionTranslations(labels: StudentIdentityLabels): OnboardingSectionTranslations {
  return {
    fields: {
      fullName: labels.name,
      email: "Email",
      password: "Password",
      phone: "",
      avatar: labels.avatar,
      nationality: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      male: "",
      female: "",
      qualifications: "",
    },
    placeholders: {
      fullName: labels.namePlaceholder,
      email: "Enter student email",
      password: "Enter student password",
      phone: "",
      nationality: "",
      address: "",
      dateOfBirth: "",
      qualifications: "",
    },
    validation: { nameMinLength: labels.nameMinLength },
  };
}

export function StudentIdentityFields({
  register,
  control,
  errors,
  labels,
  onUploadAvatar,
}: Readonly<StudentIdentityFieldsProps>) {
  const translate = toSectionTranslations(labels);

  return (
    <UserIdentityFields
      register={register}
      control={control}
      errors={errors}
      translate={translate}
      hidePhone
      onUploadAvatar={onUploadAvatar}
    />
  );
}
