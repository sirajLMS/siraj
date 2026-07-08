"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import { PrimaryPageAction } from "@/frontend/components/ui";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments/profile.documents";
import { useRouter } from "@/shared/i18n/routing";

const parentOwnEditSchema = z.object({
  phone: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  twitter: z.string().optional(),
  skype: z.string().optional(),
  defaultZoomLink: z.string().optional(),
});

type ParentOwnEditFormData = z.infer<typeof parentOwnEditSchema>;

type ParentProfileContainerProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
};

export function ParentProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: ParentProfileContainerProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");
  const router = useRouter();

  const { data, loading, error } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  const [updateOwnProfile, { loading: savingOwn }] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile, { loading: savingOther }] = useMutation(updateUserProfileMutationDocument);

  const profile = data?.profileByUserId;
  const parentData = scope === "own" ? profile?.parentOwnProfile : profile?.parentAdminProfile;
  const isSaving = savingOwn || savingOther;

  const { register, handleSubmit, reset } = useForm<ParentOwnEditFormData>({
    resolver: zodResolver(parentOwnEditSchema),
    defaultValues: {
      phone: "",
      facebook: "",
      whatsapp: "",
      twitter: "",
      skype: "",
      defaultZoomLink: "",
    },
  });

  useEffect(() => {
    if (parentData) {
      reset({
        phone: parentData.phone ?? "",
        facebook: parentData.facebook ?? "",
        whatsapp: parentData.whatsapp ?? "",
        twitter: parentData.twitter ?? "",
        skype: parentData.skype ?? "",
        defaultZoomLink: parentData.defaultZoomLink ?? "",
      });
    }
  }, [parentData, reset]);

  const onSubmit = async (formData: ParentOwnEditFormData) => {
    const parentInput = {
      phone: formData.phone || null,
      facebook: formData.facebook || null,
      whatsapp: formData.whatsapp || null,
      twitter: formData.twitter || null,
      skype: formData.skype || null,
      defaultZoomLink: formData.defaultZoomLink || null,
    };

    if (scope === "own") {
      await updateOwnProfile({ variables: { input: { parent: parentInput } } });
      router.push("/profile");
      return;
    }

    await updateUserProfile({ variables: { userId: targetUserId, input: { parent: parentInput } } });
    router.push(`/users/${targetUserId}/profile`);
  };

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

  if (!parentData) {
    return null;
  }

  if (mode === "view") {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography sx={{ typography: "titleLg", mb: 2 }}>{t("sections.contact")}</Typography>
            <Stack spacing={1}>
              <Typography sx={{ typography: "bodyMd" }}>{parentData.name}</Typography>
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {parentData.email}
              </Typography>
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {parentData.phone ?? tc("notSet")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography sx={{ typography: "titleLg", mb: 2 }}>{t("sections.social")}</Typography>
            <Stack spacing={1}>
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {t("fields.whatsapp")}: {parentData.whatsapp ?? tc("notSet")}
              </Typography>
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {t("fields.facebook")}: {parentData.facebook ?? tc("notSet")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        {(["phone", "whatsapp", "facebook", "twitter", "skype", "defaultZoomLink"] as const).map(field => (
          <Box key={field}>
            <Typography sx={{ typography: "labelMd", mb: 0.5 }}>{t(`fields.${field}`)}</Typography>
            <Box
              component="input"
              {...register(field)}
              sx={theme => ({
                width: "100%",
                p: 1.5,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
              })}
            />
          </Box>
        ))}
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
