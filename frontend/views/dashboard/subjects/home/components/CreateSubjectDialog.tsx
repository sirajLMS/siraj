"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import type { CreateSubjectDialogProps } from "../types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const createSubjectSchema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().min(1, "slugRequired"),
  categoryId: z.string().min(1, "categoryRequired"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;

export function CreateSubjectDialog({
  open,
  onClose,
  onSubmit,
  categories,
  isLoading,
}: Readonly<CreateSubjectDialogProps>) {
  const t = useTranslations("dashboard.subjects");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      slug: "",
      categoryId: "",
      description: "",
      isActive: true,
    },
  });

  const nameValue = useWatch({ control, name: "name" });

  useEffect(() => {
    if (open) {
      reset({ name: "", slug: "", categoryId: "", description: "", isActive: true });
    }
  }, [open, reset]);

  useEffect(() => {
    setValue("slug", slugify(nameValue));
  }, [nameValue, setValue]);

  const handleFormSubmit = (data: CreateSubjectFormValues) => {
    onSubmit({
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="create-subject-dialog-title"
    >
      <DialogTitle id="create-subject-dialog-title">{t("createSubject")}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id="create-subject-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FieldWrapper label={t("nameLabel")} required error={errors.name ? t("nameRequired") : undefined}>
                <TextField
                  {...field}
                  fullWidth
                  variant="standard"
                  error={!!errors.name}
                  disabled={isLoading}
                  sx={standardInputSx}
                />
              </FieldWrapper>
            )}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <FieldWrapper label={t("slugLabel")} required error={errors.slug ? t("slugRequired") : undefined}>
                <TextField
                  {...field}
                  fullWidth
                  variant="standard"
                  error={!!errors.slug}
                  disabled={isLoading}
                  sx={standardInputSx}
                />
              </FieldWrapper>
            )}
          />

          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <FieldWrapper
                label={t("categoryLabel")}
                required
                error={errors.categoryId ? t("categoryRequired") : undefined}
              >
                <Select
                  {...field}
                  fullWidth
                  variant="standard"
                  error={!!errors.categoryId}
                  disabled={isLoading}
                  sx={standardInputSx}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    {t("selectCategory")}
                  </MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id ?? ""}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FieldWrapper>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <FieldWrapper label={t("descriptionLabel")}>
                <TextField
                  {...field}
                  fullWidth
                  variant="standard"
                  multiline
                  rows={3}
                  disabled={isLoading}
                  sx={standardInputSx}
                />
              </FieldWrapper>
            )}
          />

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Switch checked={field.value ?? true} onChange={field.onChange} disabled={isLoading} />
                <Typography variant="bodyMd">{t("activeLabel")}</Typography>
              </Box>
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="text"
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontWeight: 700,
            borderRadius: 1.5,
          })}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          form="create-subject-form"
          disabled={isLoading}
          variant="contained"
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          })}
        >
          {isLoading ? "..." : t("createSubject")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
