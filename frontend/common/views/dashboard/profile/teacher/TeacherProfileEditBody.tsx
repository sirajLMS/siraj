"use client";

import { type CurrencyCode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  isTeacherAdminData,
  type TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherAdminEditForm } from "@/frontend/common/views/dashboard/profile/teacher/TeacherAdminEditForm";
import { TeacherProfileEditForm } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditForm";
import type { TeacherEditData } from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";

function toTeacherEditData(
  teacherData: TeacherViewData,
  avatarUrl: string | null | undefined,
  displayCurrency: CurrencyCode | null | undefined
): TeacherEditData {
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  return {
    name: teacherData.name,
    email: teacherData.email,
    avatarUrl,
    phone: teacherData.phone,
    displayCurrency,
    // nationalId/nationality are present on both own and admin profiles now;
    // prefer the admin-scoped value when available, else fall back to own.
    nationalId: adminData?.nationalId ?? teacherData.nationalId ?? null,
    nationality: adminData?.nationality ?? teacherData.nationality ?? null,
    dateOfBirth: adminData?.dateOfBirth ?? teacherData.dateOfBirth ?? null,
    gender: adminData?.gender ?? teacherData.gender ?? null,
    address: adminData?.address ?? teacherData.address ?? null,
    qualifications: adminData?.qualifications ?? teacherData.qualifications ?? null,
    timezone: teacherData.timezone,
    hourlyRate: teacherData.hourlyRate,
    rateCurrency: teacherData.rateCurrency,
    status: adminData?.status ?? null,
  };
}

export function TeacherProfileEditBody({
  teacherData,
  avatarUrl,
  displayCurrency,
  scope,
  targetUserId,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
}: Readonly<{
  teacherData: TeacherViewData;
  avatarUrl: string | null | undefined;
  displayCurrency: CurrencyCode | null | undefined;
  scope: ProfileScope;
  targetUserId: string;
  isSaving: boolean;
  onSubmitOwn: TeacherProfileViewModel["onSubmitOwn"];
  onSubmitAdmin: TeacherProfileViewModel["onSubmitAdmin"];
}>) {
  const editData = toTeacherEditData(teacherData, avatarUrl, displayCurrency);

  if (scope === ProfileScope.Own) {
    return (
      <TeacherProfileEditForm
        teacherData={editData}
        targetUserId={targetUserId}
        isSaving={isSaving}
        onSubmit={async values => {
          await onSubmitOwn({
            name: values.name,
            email: values.email,
            phone: values.phone ?? "",
            nationalId: values.nationalId ?? "",
            nationality: values.nationality ?? "",
            avatarUrl: values.avatarUrl,
            displayCurrency: values.displayCurrency ?? null,
          });
        }}
      />
    );
  }

  return (
    <TeacherAdminEditForm
      teacherData={editData}
      targetUserId={targetUserId}
      isSaving={isSaving}
      onSubmit={async values => {
        await onSubmitAdmin({
          name: values.name,
          email: values.email,
          phone: values.phone ?? "",
          avatarUrl: values.avatarUrl,
          nationalId: values.nationalId ?? "",
          dateOfBirth: values.dateOfBirth ?? "",
          gender: values.gender ?? null,
          address: values.address ?? "",
          qualifications: values.qualifications ?? "",
          timezone: values.timezone ?? "",
          hourlyRate: values.hourlyRate ?? "",
          rateCurrency: values.rateCurrency,
          status: values.status ?? "",
          displayCurrency: values.displayCurrency ?? null,
        });
      }}
    />
  );
}
