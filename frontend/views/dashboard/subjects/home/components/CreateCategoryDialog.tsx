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
import type { CreateCategoryDialogProps } from "../types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const createCategorySchema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().min(1, "slugRequired"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

interface CategoryFormFieldsProps {
  readonly control: Control<CreateCategoryFormValues>;
  readonly errors: FieldErrors<CreateCategoryFormValues>;
  readonly isLoading: boolean;
  readonly t: ReturnType<typeof useTranslations<"dashboard.subjects">>;
  readonly onSubmit: React.FormEventHandler<HTMLFormElement>;
}

function CategoryFormFields({ control, errors, isLoading, t, onSubmit }: Readonly<CategoryFormFieldsProps>) {
  return (
    <Box
      component="form"
      id="create-category-form"
      onSubmit={onSubmit}
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
  );
}

interface CategoryDialogActionsProps {
  readonly onClose: () => void;
  readonly isLoading: boolean;
  readonly t: ReturnType<typeof useTranslations<"dashboard.subjects">>;
}

function CategoryDialogActions({ onClose, isLoading, t }: Readonly<CategoryDialogActionsProps>) {
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
        {t("cancel")}
      </Button>
      <Button
        type="submit"
        form="create-category-form"
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
        {isLoading ? "..." : t("createCategory")}
      </Button>
    </DialogActions>
  );
}

export function CreateCategoryDialog({ open, onClose, onSubmit, isLoading }: Readonly<CreateCategoryDialogProps>) {
  const t = useTranslations("dashboard.subjects");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
    },
  });

  const nameValue = useWatch({ control, name: "name" });

  useEffect(() => {
    if (open) {
      reset({ name: "", slug: "", description: "", isActive: true });
    }
  }, [open, reset]);

  useEffect(() => {
    setValue("slug", slugify(nameValue));
  }, [nameValue, setValue]);

  const handleFormSubmit = (data: CreateCategoryFormValues) => {
    onSubmit({
      name: data.name,
      slug: data.slug,
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
      aria-labelledby="create-category-dialog-title"
    >
      <DialogTitle id="create-category-dialog-title">{t("createCategory")}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <CategoryFormFields
          control={control}
          errors={errors}
          isLoading={isLoading}
          t={t}
          onSubmit={handleSubmit(handleFormSubmit)}
        />
      </DialogContent>
      <CategoryDialogActions onClose={onClose} isLoading={isLoading} t={t} />
    </Dialog>
  );
}
