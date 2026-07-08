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
} from "@/frontend/graphql/sharedDocuments/profile.documents";
import { useRouter } from "@/shared/i18n/routing";

const staffEditSchema = z.object({
  phone: z.string().optional(),
  skypeId: z.string().optional(),
});

type StaffEditFormData = z.infer<typeof staffEditSchema>;

type StaffProfileContainerProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
};

export function StaffProfileContainer({
  scope,
  mode,
  targetUserId,
  activeTab: _activeTab = "profile",
}: StaffProfileContainerProps) {
  const t = useTranslations("profile.staff");
  const tc = useTranslations("profile");
  const router = useRouter();

  const { data, loading, error } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  const [updateOwnProfile, { loading: saving }] = useMutation(updateOwnProfileMutationDocument);

  const staffData = data?.profileByUserId?.staffProfile;

  const { register, handleSubmit, reset } = useForm<StaffEditFormData>({
    resolver: zodResolver(staffEditSchema),
    defaultValues: { phone: "", skypeId: "" },
  });

  useEffect(() => {
    if (staffData) {
      reset({
        phone: staffData.phone ?? "",
        skypeId: staffData.skypeId ?? "",
      });
    }
  }, [staffData, reset]);

  const onSubmit = async (formData: StaffEditFormData) => {
    await updateOwnProfile({
      variables: {
        input: {
          staff: {
            phone: formData.phone || null,
            skypeId: formData.skypeId || null,
          },
        },
      },
    });
    router.push("/profile");
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

  if (!staffData) {
    return null;
  }

  if (mode === "view") {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography sx={{ typography: "titleLg", mb: 2 }}>{t("sections.contact")}</Typography>
            <Stack spacing={1}>
              <Typography sx={{ typography: "bodyMd" }}>{staffData.name}</Typography>
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {staffData.email}
              </Typography>
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {staffData.phone ?? tc("notSet")}
              </Typography>
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {staffData.roleName ?? staffData.roleSlug ?? tc("notSet")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  if (scope !== "own") {
    return (
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
        {tc("adminEditHint")}
      </Typography>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Box>
          <Typography sx={{ typography: "labelMd", mb: 0.5 }}>{t("fields.phone")}</Typography>
          <Box
            component="input"
            {...register("phone")}
            sx={theme => ({
              width: "100%",
              p: 1.5,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
            })}
          />
        </Box>
        <Box>
          <Typography sx={{ typography: "labelMd", mb: 0.5 }}>{t("fields.skypeId")}</Typography>
          <Box
            component="input"
            {...register("skypeId")}
            sx={theme => ({
              width: "100%",
              p: 1.5,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
            })}
          />
        </Box>
        <PrimaryPageAction type="submit" disabled={saving}>
          {tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
