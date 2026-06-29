"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import type { EditCategoryDialogProps } from "../types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const editCategorySchema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().min(1, "slugRequired"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type EditCategoryFormValues = z.infer<typeof editCategorySchema>;

export function EditCategoryDialog({
  open,
  onClose,
  onSubmit,
  category,
  isLoading,
}: Readonly<EditCategoryDialogProps>) {
  const t = useTranslations("dashboard.subjects");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open && category) {
      reset({
        name: category.name ?? "",
        slug: category.slug ?? "",
        description: category.description ?? "",
        isActive: category.isActive ?? true,
      });
    }
  }, [open, category, reset]);

  const nameValue = useWatch({ control, name: "name" });

  useEffect(() => {
    if (nameValue) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, setValue]);

  const handleFormSubmit = (data: EditCategoryFormValues) => {
    if (!category?.id) return;
    onSubmit(category.id, {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
    });
  };

  if (!category) return null;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="edit-category-dialog-title"
    >
      <DialogTitle id="edit-category-dialog-title">{t("editCategory")}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id="edit-category-form"
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
          form="edit-category-form"
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
          {isLoading ? "..." : t("saveChanges")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
