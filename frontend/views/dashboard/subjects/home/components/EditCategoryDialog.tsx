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
import { type Control, Controller, type FieldErrors, useForm, useWatch } from "react-hook-form";
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

function TextFieldController({
  name,
  control,
  label,
  required,
  error,
  disabled,
  multiline,
  rows,
}: Readonly<{
  name: keyof EditCategoryFormValues & ("name" | "slug" | "description");
  control: Control<EditCategoryFormValues>;
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FieldWrapper label={label} required={required} error={error}>
          <TextField
            {...field}
            fullWidth
            variant="standard"
            error={!!error}
            multiline={multiline}
            rows={rows}
            disabled={disabled}
            sx={standardInputSx}
          />
        </FieldWrapper>
      )}
    />
  );
}

function CategoryFormFields({
  control,
  errors,
  disabled,
}: Readonly<{
  control: Control<EditCategoryFormValues>;
  errors: FieldErrors<EditCategoryFormValues>;
  disabled: boolean;
}>) {
  const t = useTranslations("dashboard.subjects");

  return (
    <>
      <TextFieldController
        name="name"
        control={control}
        label={t("nameLabel")}
        required
        error={errors.name ? t("nameRequired") : undefined}
        disabled={disabled}
      />
      <TextFieldController
        name="slug"
        control={control}
        label={t("slugLabel")}
        required
        error={errors.slug ? t("slugRequired") : undefined}
        disabled={disabled}
      />
      <TextFieldController
        name="description"
        control={control}
        label={t("descriptionLabel")}
        disabled={disabled}
        multiline
        rows={3}
      />
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Switch checked={field.value ?? true} onChange={field.onChange} disabled={disabled} />
            <Typography variant="bodyMd">{t("activeLabel")}</Typography>
          </Box>
        )}
      />
    </>
  );
}

function EditCategoryDialogActions({
  isLoading,
  onClose,
  saveLabel,
  cancelLabel,
}: Readonly<{
  isLoading: boolean;
  onClose: () => void;
  saveLabel: string;
  cancelLabel: string;
}>) {
  return (
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
        {cancelLabel}
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
        {isLoading ? "..." : saveLabel}
      </Button>
    </DialogActions>
  );
}

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
          <CategoryFormFields control={control} errors={errors} disabled={isLoading} />
        </Box>
      </DialogContent>
      <EditCategoryDialogActions
        isLoading={isLoading}
        onClose={onClose}
        saveLabel={t("saveChanges")}
        cancelLabel={t("cancel")}
      />
    </Dialog>
  );
}
