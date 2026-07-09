"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  AppPermission,
  type Gender,
  AccountStatus as GqlAccountStatus,
  type PaymentMethod,
} from "@/frontend/graphql/generated/gql/graphql-types";
import {
  teacherProfileForEditQueryDocument,
  updateTeacherProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/staff-profile.documents";
import { toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { logger } from "@/frontend/utils/logger";
import type { TeacherProfileFormData } from "./schemas/teacherProfileSchema";
import { TeacherProfileView } from "./TeacherProfileView";
import type { TeacherProfileData } from "./types";
export function TeacherProfileContainer() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const notifications = useNotifications();
  const tActions = useTranslations("dashboard.teacherProfile.actions");

  const { data, loading, refetch } = useQuery(teacherProfileForEditQueryDocument, {
    variables: { teacherId: id },
    skip: !id,
  });

  const [updateProfile, { loading: isSaving }] = useMutation(updateTeacherProfileMutationDocument);

  const handleSave = async (formData: TeacherProfileFormData) => {
    try {
      await updateProfile({
        variables: {
          teacherId: id,
          input: {
            phone: formData.phone || null,
            gender: formData.gender as Gender,
            timezone: toGraphqlIanaTimezone(formData.timezone),
            address: formData.address || null,
            hourlyRate: String(formData.baseSalary),
            rateCurrency: formData.currency,
            paymentMethod: formData.paymentMethod as PaymentMethod,
            status: null,
            zoomLink: formData.zoomLink || null,
            dateOfBirth: null,
            nationalId: null,
            qualifications: null,
            zoomPassword: null,
            zoomUsername: null,
          },
        },
      });
      await refetch();
      notifications.show(tActions("saveSuccess"), { severity: "success", autoHideDuration: 4000 });
    } catch (error) {
      logger.error("Failed to update teacher profile", { error });
      notifications.show(tActions("saveError"), { severity: "error", autoHideDuration: 5000 });
    }
  };

  const profile: TeacherProfileData | null = data?.teacherProfileForEdit
    ? {
        id: data.teacherProfileForEdit.id ?? "",
        userId: data.teacherProfileForEdit.userId ?? "",
        fullName: data.teacherProfileForEdit.name ?? "",
        email: data.teacherProfileForEdit.email ?? "",
        phone: data.teacherProfileForEdit.phone ?? "",
        gender: data.teacherProfileForEdit.gender ?? null,
        timezone: data.teacherProfileForEdit.timezone ?? "",
        address: data.teacherProfileForEdit.address ?? "",
        baseSalary: Number.parseFloat(data.teacherProfileForEdit.hourlyRate ?? "0"),
        currency: data.teacherProfileForEdit.rateCurrency ?? "USD",
        paymentMethod: data.teacherProfileForEdit.paymentMethod ?? null,
        zoomLink: data.teacherProfileForEdit.zoomLink ?? "",
        accountStatus: data.teacherProfileForEdit.status === GqlAccountStatus.Activated,
        updatedAt: data.teacherProfileForEdit.updatedAt ?? "",
        totalClasses: data.teacherProfileForEdit.totalClasses ?? 0,
        avgEngagementScore: data.teacherProfileForEdit.avgEngagementScore ?? 0,
      }
    : null;

  return (
    <RequirePermission permissions={[AppPermission.StaffEditProfile]}>
      <TeacherProfileView profile={profile} isLoading={loading} isSaving={isSaving} onSave={handleSave} />
    </RequirePermission>
  );
}
