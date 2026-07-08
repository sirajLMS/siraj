"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/profile.documents";
import { useRouter } from "@/shared/i18n/routing";
import { TeacherBankingTab } from "./banking/TeacherBankingTab";
import { AssignedStudentsTab } from "./students/AssignedStudentsTab";
import { type TeacherOwnEditFormData, TeacherProfileEditForm } from "./TeacherProfileEditForm";
import { TeacherProfileView } from "./TeacherProfileView";

const teacherOwnEditSchema = z.object({
  phone: z.string().optional(),
  zoomLink: z.string().optional(),
});

type TeacherProfileContainerProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
};

export function TeacherProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: TeacherProfileContainerProps) {
  const activeTab = _activeTab;
  const tc = useTranslations("profile");
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  const [updateOwnProfile, { loading: savingOwn }] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile, { loading: savingOther }] = useMutation(updateUserProfileMutationDocument);

  const profile = data?.profileByUserId;
  const teacherData = scope === "own" ? profile?.teacherOwnProfile : profile?.teacherAdminProfile;
  const isSaving = savingOwn || savingOther;

  const form = useForm<TeacherOwnEditFormData>({
    resolver: zodResolver(teacherOwnEditSchema),
    defaultValues: { phone: "", zoomLink: "" },
  });

  useEffect(() => {
    if (teacherData && scope === "own") {
      form.reset({
        phone: teacherData.phone ?? "",
        zoomLink: "zoomLink" in teacherData ? (teacherData.zoomLink ?? "") : "",
      });
    }
  }, [teacherData, form, scope]);

  const onSubmit = async (formData: TeacherOwnEditFormData) => {
    const teacherInput = {
      phone: formData.phone || null,
      zoomLink: formData.zoomLink || null,
    };

    if (scope === "own") {
      await updateOwnProfile({ variables: { input: { teacher: teacherInput } } });
      router.push("/profile");
      return;
    }

    await updateUserProfile({ variables: { userId: targetUserId, input: { teacher: teacherInput } } });
    router.push(`/users/${targetUserId}/profile`);
  };

  if (activeTab === "banking" && scope === "other") {
    return <TeacherBankingTab targetUserId={targetUserId} mode={mode} />;
  }

  if (activeTab === "students" && scope === "other") {
    return (
      <AssignedStudentsTab
        assignedStudents={profile?.assignedStudents}
        loading={loading}
        hasError={Boolean(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.error.main }}>
        {tc("errors.failedToLoad")}
      </Typography>
    );
  }

  if (!teacherData) {
    return <Typography sx={{ color: theme => theme.palette.text.secondary }}>{tc("errors.notFound")}</Typography>;
  }

  if (mode === "view") {
    return <TeacherProfileView teacherData={teacherData} />;
  }

  if (scope === "own") {
    return (
      <TeacherProfileEditForm
        register={form.register}
        errors={form.formState.errors}
        handleSubmit={form.handleSubmit}
        onSubmit={onSubmit}
        isSaving={isSaving}
      />
    );
  }

  return (
    <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
      {tc("adminEditHint")}
    </Typography>
  );
}
