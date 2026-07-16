"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { StudentProfileView } from "@/frontend/common/views/dashboard/student/profile/studentProfileView";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";
import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/studentPortal/studentProfile";

function useStudentProfileLabels(
  t: ReturnType<typeof useAppTranslation>["dashboardTranslations"]["studentPortalProfile"]
): StudentProfileLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      personalInfo: t.personalInfo,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      dateOfBirth: t.dateOfBirth,
      gender: t.gender,
      language: t.language,
      parentInfo: t.parentInfo,
      parentName: t.parentName,
      parentEmail: t.parentEmail,
      parentPhone: t.parentPhone,
      academicInfo: t.academicInfo,
      teacher: t.teacher,
      hoursPerWeek: t.hoursPerWeek,
      classesRemaining: t.classesRemaining,
      classesTotal: t.classesTotal,
      editProfile: t.editProfile,
      saveChanges: t.saveChanges,
      cancel: t.cancel,
      loadingMessage: t.loadingMessage,
      saveSuccess: t.saveSuccess,
      saveError: t.saveError,
    }),
    [t]
  );
}

export function StudentProfileContainer() {
  const t = useAppTranslation().dashboardTranslations.studentPortalProfile;
  const router = useRouter();
  const labels = useStudentProfileLabels(t);

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-and-network",
  });

  const profile: StudentProfileRow | null = useMemo(() => {
    if (!profileData?.studentProfile) return null;
    const p = profileData.studentProfile;
    return {
      id: p.id ?? "",
      name: p.name ?? "",
      status: p.status ?? "",
      avatarUrl: p.avatarUrl ?? null,
      dateOfBirth: p.dateOfBirth ?? null,
      gender: p.gender ?? null,
      language: p.language ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
      parentId: p.parentId ?? null,
      parentUserId: p.parentUserId ?? null,
      parentName: p.parentName ?? null,
      parentEmail: p.parentEmail ?? null,
      parentPhone: p.parentPhone ?? null,
      isAssociatedViewer: p.isAssociatedViewer ?? false,
      primaryTeacherId: p.primaryTeacherId ?? null,
      teacherUserId: p.teacherUserId ?? null,
      teacherName: p.teacherName ?? null,
      hoursPerWeek: p.hoursPerWeek ?? null,
      classesRemaining: p.classesRemaining ?? null,
      classesTotal: p.classesTotal ?? null,
      version: p.version ?? 0,
      createdAt: p.createdAt ?? null,
      updatedAt: p.updatedAt ?? null,
    };
  }, [profileData]);

  const loading = profileLoading;

  return (
    <StudentProfileView
      profile={profile}
      labels={labels}
      loading={loading}
      onBackToDashboard={() => router.push("/students/me")}
    />
  );
}
