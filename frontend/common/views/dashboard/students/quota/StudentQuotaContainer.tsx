"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  studentByIdQueryDocument,
  updateStudentQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import { canViewStudentProfileTab } from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/StudentQuotaView";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import { useRouter } from "@/shared/i18n/routing";
import { type CommonLabels, useAppTranslation } from "@/shared/locale";

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

function getStudentQuotaLoadingState(
  useUnifiedProfile: boolean,
  profileContext: ReturnType<typeof useStudentProfileContext>,
  loading: boolean,
  data: unknown,
  queryError: unknown
): "loading" | "missing" | "error" | "ready" {
  const unifiedLoading = Boolean(profileContext?.loading);
  const unifiedProfileMissing = !profileContext?.profile;

  if ((useUnifiedProfile ? unifiedLoading : loading) && !data && !profileContext?.profile) {
    return "loading";
  }
  if (useUnifiedProfile && !unifiedLoading && unifiedProfileMissing) {
    return "missing";
  }
  if (!useUnifiedProfile && queryError) {
    return "error";
  }
  return "ready";
}

function buildStudentQuotaData(
  useUnifiedProfile: boolean,
  profile: StudentProfileQueryData | null | undefined,
  studentById:
    | {
        id: string | null;
        name: string | null;
        language?: string | null;
        gender?: string | null;
        teacherName?: string | null;
        classesTotal?: number | null;
        classesRemaining?: number | null;
        updatedAt?: string | null;
        primaryTeacherId?: string | null;
        avatarUrl?: string | null;
      }
    | undefined,
  tc: CommonLabels
): StudentProfileData | null {
  const s = useUnifiedProfile ? profile : studentById;
  if (!s || typeof s.id !== "string" || s.id.length === 0) return null;

  return {
    id: s.id,
    studentName: s.name ?? tc.notSet,
    dateOfBirth: useUnifiedProfile && profile?.dateOfBirth ? String(profile.dateOfBirth) : "",
    language: s.language === "en" ? "en" : "ar",
    gender: resolveGenderLabel(s.gender) ?? "",
    teacher: s.teacherName ?? "",
    totalClasses: s.classesTotal ?? 0,
    classesLeft: s.classesRemaining ?? 0,
    profileImage: useUnifiedProfile ? (profile?.avatarUrl ?? "") : "",
    lastEditedTime: s?.updatedAt ? formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true }) : "",
    primaryTeacherId: s.primaryTeacherId ?? null,
  };
}

export function StudentQuotaContainer() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const tc = useAppTranslation().commonTranslations;
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
      notifications.show(t.actions.saveSuccess, { severity: "success", autoHideDuration: 4000 });
      if (useUnifiedProfile) {
        profileContext?.refetch({ year: null, month: null }).catch(() => undefined);
      } else {
        refetch().catch(() => undefined);
      }
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    },
    onError: mutationError => {
      logger.error("Update quota failed:", { mutationError });
      notifications.show(tc.operationFailed, { severity: "error", autoHideDuration: 5000 });
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
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t.errors.invalidId}</Typography>;
  }

  if (!hasTabAccess) {
    return <ProfileRestrictedSection title={t.breadcrumbs.adjustQuota} />;
  }

  const loadingState = getStudentQuotaLoadingState(useUnifiedProfile, profileContext, loading, data, error);

  if (loadingState === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadingState === "missing") {
    return <ProfileRestrictedSection title={t.breadcrumbs.adjustQuota} />;
  }

  if (loadingState === "error") {
    logger.error("Error loading student quota:", { error });
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{tc.loadFailed}</Typography>;
  }

  const studentData = buildStudentQuotaData(
    useUnifiedProfile,
    profileContext?.profile ?? undefined,
    data?.studentById ?? undefined,
    tc
  );

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
      isLoading={useUnifiedProfile ? Boolean(profileContext?.loading) : loading}
      isSaving={saving}
      isSaved={isSaved}
      embedded={useUnifiedProfile}
      readOnly={!canEditQuota}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
