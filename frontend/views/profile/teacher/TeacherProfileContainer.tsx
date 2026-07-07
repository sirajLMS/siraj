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
import { ProfileActionBar } from "../core/components/ProfileActionBar";
import { ProfileShell } from "../core/ProfileShell";
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
};

export function TeacherProfileContainer({ scope, mode, targetUserId }: TeacherProfileContainerProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");
  const router = useRouter();

  const { data, loading, error } = useQuery(profileByUserIdQueryDocument, {
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

  const title = mode === "edit" ? tc("editTitle") : tc("pageTitle");

  return (
    <ProfileShell
      title={title}
      subtitle={t("subtitle")}
      loading={loading}
      error={error ? tc("errors.failedToLoad") : null}
      actions={
        mode === "view" && scope === "own" ? (
          <ProfileActionBar editHref="/profile/edit" editLabel={tc("actions.edit")} />
        ) : null
      }
    >
      {teacherData && mode === "view" ? <TeacherProfileView teacherData={teacherData} /> : null}
      {teacherData && mode === "edit" && scope === "own" ? (
        <TeacherProfileEditForm
          register={form.register}
          errors={form.formState.errors}
          handleSubmit={form.handleSubmit}
          onSubmit={onSubmit}
          isSaving={isSaving}
        />
      ) : null}
      {teacherData && mode === "edit" && scope === "other" ? (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {tc("adminEditHint")}
        </Typography>
      ) : null}
      {!teacherData && !loading && !error ? (
        <Typography sx={{ color: theme => theme.palette.text.secondary }}>{tc("errors.notFound")}</Typography>
      ) : null}
    </ProfileShell>
  );
}
