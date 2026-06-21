"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentByIdQueryDocument, updateStudentQuotaMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { StudentQuotaView } from "./StudentQuotaView";
import type { StudentQuotaFormData } from "./schemas/studentQuotaSchema";

export function StudentQuotaContainer() {
  const t = useTranslations("dashboard.studentQuota");
  const params = useParams();
  const studentId = typeof params?.id === "string" ? params.id : "";

  const [isSaved, setIsSaved] = useState(false);

  const { data, loading, error, refetch } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const [updateQuota, { loading: saving }] = useMutation(updateStudentQuotaMutationDocument, {
    onCompleted: () => {
      setIsSaved(true);
      void refetch();
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{error.message}</Typography>;
  }

  const s = data?.studentById;
  const studentData =
    s && typeof s.id === "string" && s.id.length > 0 && typeof s.name === "string" && s.name.length > 0
      ? {
          id: s.id,
          studentName: s.name,
          dateOfBirth: "",
          language: s.language ?? "Arabic",
          gender: (s.gender?.toLowerCase() ?? "male") as "male" | "female",
          teacher: s.teacherName ?? "",
          totalClasses: s.classesTotal ?? 0,
          classesLeft: s.classesRemaining ?? 0,
          profileImage: "",
          lastEditedBy: "admin",
          lastEditedTime: "just now",
        }
      : null;

  return (
    <RequirePermission permissions={[AppPermission.StudentEditQuota]}>
      <StudentQuotaView
        studentData={studentData}
        isLoading={loading}
        isSaving={saving}
        isSaved={isSaved}
        onSave={handleSave}
      />
    </RequirePermission>
  );
}

export default StudentQuotaContainer;
