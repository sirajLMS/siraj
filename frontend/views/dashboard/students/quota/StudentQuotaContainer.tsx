"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentByIdQueryDocument, updateStudentQuotaMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { StudentQuotaView } from "@/frontend/views/dashboard/students/quota/StudentQuotaView";
import type { StudentQuotaFormData } from "@/frontend/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type { StudentProfileData } from "@/frontend/views/dashboard/students/quota/types";
import { useRouter } from "@/shared/i18n/routing";

export function StudentQuotaContainer() {
  const t = useTranslations("dashboard.studentQuota");
  const tc = useTranslations("common");
  const params = useParams();
  const studentId = typeof params?.id === "string" ? params.id : "";
  const notifications = useNotifications();
  const router = useRouter();

  const [isSaved, setIsSaved] = useState(false);

  const { data, loading, error, refetch } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const [updateQuota, { loading: saving }] = useMutation(updateStudentQuotaMutationDocument, {
    onCompleted: () => {
      setIsSaved(true);
      notifications.show(t("actions.saveSuccess"), { severity: "success", autoHideDuration: 4000 });
      void refetch();
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
    if (!studentId) return;
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

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    logger.error("Error loading student quota:", { error });
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{tc("loadFailed")}</Typography>;
  }

  const s = data?.studentById;
  const studentData: StudentProfileData | null =
    s && typeof s.id === "string" && s.id.length > 0 && typeof s.name === "string" && s.name.length > 0
      ? {
          id: s.id,
          studentName: s.name ?? tc("notSet"),
          dateOfBirth: "",
          language: s.language === "en" ? "en" : "ar",
          gender: s.gender?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE",
          teacher: s.teacherName ?? "",
          totalClasses: s.classesTotal ?? 0,
          classesLeft: s.classesRemaining ?? 0,
          profileImage: "",
          lastEditedBy: t("common.system"),
          lastEditedTime: s.updatedAt ? formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true }) : tc("notSet"),
          primaryTeacherId: s.primaryTeacherId ?? null,
        }
      : null;

  const handleCancel = () => {
    router.back();
  };

  const handleEditAvatar = () => {
    router.back();
  };

  return (
    <RequirePermission permissions={[AppPermission.StudentEditQuota]}>
      <StudentQuotaView
        studentData={studentData}
        isLoading={loading}
        isSaving={saving}
        isSaved={isSaved}
        onSave={handleSave}
        onCancel={handleCancel}
        onEditAvatar={handleEditAvatar}
      />
    </RequirePermission>
  );
}
