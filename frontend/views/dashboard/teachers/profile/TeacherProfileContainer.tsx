"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  teacherProfileForEditQueryDocument,
  updateTeacherProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/staff-profile.documents";
import { logger } from "@/frontend/utils/logger";
import type { TeacherProfileFormData } from "./schemas/teacherProfileSchema";
import { TeacherProfileView } from "./TeacherProfileView";

export function TeacherProfileContainer() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

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
            gender: formData.gender,
            timezone: formData.timezone,
            address: formData.address || null,
            hourlyRate: String(formData.baseSalary),
            rateCurrency: formData.currency,
            zoomLink: formData.zoomLink || null,
            dateOfBirth: null,
            nationalId: null,
            qualifications: null,
            skypeId: null,
            zoomPassword: null,
            zoomUsername: null,
          },
        },
      });
      await refetch();
    } catch (error) {
      logger.error("Failed to update teacher profile", { error });
    }
  };

  const profile = data?.teacherProfileForEdit
    ? {
        id: data.teacherProfileForEdit.id ?? "",
        fullName: data.teacherProfileForEdit.name ?? "",
        email: data.teacherProfileForEdit.email ?? "",
        phone: data.teacherProfileForEdit.phone ?? "",
        gender: (data.teacherProfileForEdit.gender?.toLowerCase() as "male" | "female") ?? "female",
        timezone: data.teacherProfileForEdit.timezone ?? "",
        address: data.teacherProfileForEdit.address ?? "",
        baseSalary: Number.parseFloat(data.teacherProfileForEdit.hourlyRate ?? "0"),
        currency: data.teacherProfileForEdit.rateCurrency ?? "USD",
        paymentMethod: "paypal",
        zoomLink: data.teacherProfileForEdit.zoomLink ?? "",
        accountStatus: data.teacherProfileForEdit.status === "ACTIVATED",
        lastModified: new Date().toLocaleDateString(),
        totalClasses: 0,
        parentRating: "0.0",
      }
    : null;

  return (
    <RequirePermission permissions={[AppPermission.StaffEditProfile]}>
      <TeacherProfileView profile={profile} isLoading={loading} isSaving={isSaving} onSave={handleSave} />
    </RequirePermission>
  );
}
