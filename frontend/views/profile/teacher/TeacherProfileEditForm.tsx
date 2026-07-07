"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/components/ui";

export type TeacherOwnEditFormData = {
  phone?: string;
  zoomLink?: string;
};

type TeacherProfileEditFormProps = {
  readonly register: UseFormRegister<TeacherOwnEditFormData>;
  readonly errors: FieldErrors<TeacherOwnEditFormData>;
  readonly handleSubmit: UseFormHandleSubmit<TeacherOwnEditFormData>;
  readonly onSubmit: (formData: TeacherOwnEditFormData) => Promise<void>;
  readonly isSaving: boolean;
};

export function TeacherProfileEditForm({
  register,
  errors,
  handleSubmit,
  onSubmit,
  isSaving,
}: TeacherProfileEditFormProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Typography sx={{ typography: "titleMd" }}>{t("sections.contact")}</Typography>
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
          {errors.phone ? (
            <Typography sx={{ color: theme => theme.palette.error.main, typography: "bodySm" }}>
              {errors.phone.message}
            </Typography>
          ) : null}
        </Box>
        <Box>
          <Typography sx={{ typography: "labelMd", mb: 0.5 }}>{t("fields.zoomLink")}</Typography>
          <Box
            component="input"
            {...register("zoomLink")}
            sx={theme => ({
              width: "100%",
              p: 1.5,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
            })}
          />
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
