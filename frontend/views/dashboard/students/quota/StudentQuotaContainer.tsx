"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { studentByIdQueryDocument, updateStudentQuotaMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentProfileContext } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";
import { canViewStudentProfileTab } from "@/frontend/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/views/dashboard/students/profile/useStudentFieldAccess";
import { StudentQuotaView } from "@/frontend/views/dashboard/students/quota/StudentQuotaView";
import type { StudentQuotaFormData } from "@/frontend/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type { StudentProfileData } from "@/frontend/views/dashboard/students/quota/types";
import { useRouter } from "@/shared/i18n/routing";

function resolveGenderLabel(raw: string | null | undefined): "MALE" | "FEMALE" | null {
  if (raw == null) {
    return null;
  }
  const normalized = raw.toUpperCase();
  if (normalized === "FEMALE") {
    return "FEMALE";
  }
  if (normalized === "MALE") {
    return "MALE";
  }
  return null;
}

export function StudentQuotaContainer() {
  const t = useTranslations("dashboard.studentQuota");
  const tc = useTranslations("common");
  const params = useParams();
  const profileContext = useStudentProfileContext();
  const studentId = profileContext?.studentId ?? (typeof params?.id === "string" ? params.id : "");
  const useUnifiedProfile = profileContext != null;
  const notifications = useNotifications();
  const router = useRouter();
  const { canView, canEdit } = useStudentFieldAccess();
  const canEditQuota = canEdit("student_quota_edit");
  const hasTabAccess = canViewStudentProfileTab("quota", canView);

  const [isSaved, setIsSaved] = useState(false);

  const { data, loading, error, refetch } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId || useUnifiedProfile,
  });

  const [updateQuota, { loading: saving }] = useMutation(updateStudentQuotaMutationDocument, {
    onCompleted: () => {
      setIsSaved(true);
      notifications.show(t("actions.saveSuccess"), { severity: "success", autoHideDuration: 4000 });
      if (useUnifiedProfile) {
        void profileContext?.refetch({ year: null, month: null });
      } else {
        void refetch();
      }
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    },
    onError: mutationError => {
      logger.error("Update quota failed:", { mutationError });
      notifications.show(tc("operationFailed"), { severity: "error", autoHideDuration: 5000 });
    },
  });

  const handleSave = async (formData: StudentQuotaFormData) => {
    if (!studentId || !canEditQuota) return;
    await updateQuota({
      variables: {
        studentId,
        newClassesRemaining: formData.classesLeft,
        expectedVersion: null,
      },
    });
  };

  if (!studentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (!hasTabAccess) {
    return <ProfileRestrictedSection title={t("breadcrumbs.adjustQuota")} />;
  }

  const unifiedLoading = Boolean(profileContext?.loading);
  const unifiedProfileMissing = !profileContext?.profile;

  if ((useUnifiedProfile ? unifiedLoading : loading) && !data && !profileContext?.profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (useUnifiedProfile && !unifiedLoading && unifiedProfileMissing) {
    return <ProfileRestrictedSection title={t("breadcrumbs.adjustQuota")} />;
  }

  if (!useUnifiedProfile && error) {
    logger.error("Error loading student quota:", { error });
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{tc("loadFailed")}</Typography>;
  }

  const profile = profileContext?.profile;
  const s = useUnifiedProfile ? profile : data?.studentById;
  const studentData: StudentProfileData | null =
    s && typeof s.id === "string" && s.id.length > 0
      ? {
          id: s.id,
          studentName: s.name ?? tc("notSet"),
          dateOfBirth: useUnifiedProfile && profile?.dateOfBirth ? String(profile.dateOfBirth) : "",
          language: s.language === "en" ? "en" : "ar",
          gender: resolveGenderLabel(s.gender) ?? "",
          teacher: s.teacherName ?? "",
          totalClasses: s.classesTotal ?? 0,
          classesLeft: s.classesRemaining ?? 0,
          profileImage: useUnifiedProfile ? (profile?.avatarUrl ?? "") : "",
          lastEditedTime: s.updatedAt ? formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true }) : tc("notSet"),
          primaryTeacherId: s.primaryTeacherId ?? null,
        }
      : null;

  const handleCancel = () => {
    if (useUnifiedProfile) {
      router.replace(`/students/${studentId}/profile?tab=status`);
      return;
    }
    router.back();
  };

  return (
    <StudentQuotaView
      studentData={studentData}
      isLoading={useUnifiedProfile ? unifiedLoading : loading}
      isSaving={saving}
      isSaved={isSaved}
      embedded={useUnifiedProfile}
      readOnly={!canEditQuota}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
