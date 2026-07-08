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
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import type { CategoryItem, EditSubjectDialogProps, SubjectItem } from "../types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const editSubjectSchema = z.object({
  name: z.string().min(1, "nameRequired"),
  slug: z.string().min(1, "slugRequired"),
  categoryId: z.string().min(1, "categoryRequired"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type EditSubjectFormValues = z.infer<typeof editSubjectSchema>;

const formDefaultValues: EditSubjectFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  isActive: true,
};

interface SubjectFormFieldsProps {
  readonly control: Control<EditSubjectFormValues>;
  readonly errors: FieldErrors<EditSubjectFormValues>;
  readonly categories: readonly CategoryItem[];
  readonly isLoading: boolean;
}

function SubjectFormFields({ control, errors, categories, isLoading }: Readonly<SubjectFormFieldsProps>) {
  const t = useTranslations("dashboard.subjects");

  return (
    <>
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
    </>
  );
}

interface SubjectDialogActionsProps {
  readonly onClose: () => void;
  readonly isLoading: boolean;
}

function SubjectDialogActions({ onClose, isLoading }: Readonly<SubjectDialogActionsProps>) {
  const t = useTranslations("dashboard.subjects");

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
        form="edit-subject-form"
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
  );
}

function useEditSubjectForm(open: boolean, subject: SubjectItem | null) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditSubjectFormValues>({
    resolver: zodResolver(editSubjectSchema),
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (open && subject) {
      reset({
        name: subject.name ?? "",
        slug: subject.slug ?? "",
        categoryId: subject.category?.id ?? "",
        description: subject.description ?? "",
        isActive: subject.isActive ?? true,
      });
    }
  }, [open, subject, reset]);

  const nameValue = useWatch({ control, name: "name" });

  useEffect(() => {
    if (nameValue) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, setValue]);

  return { control, errors, handleSubmit };
}

export function EditSubjectDialog({
  open,
  onClose,
  onSubmit,
  subject,
  categories,
  isLoading,
}: Readonly<EditSubjectDialogProps>) {
  const { control, errors, handleSubmit } = useEditSubjectForm(open, subject);

  const handleFormSubmit = (data: EditSubjectFormValues) => {
    if (!subject?.id) return;
    onSubmit(subject.id, {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
    });
  };

  if (!subject) return null;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="edit-subject-dialog-title"
    >
      <DialogTitle id="edit-subject-dialog-title">{useTranslations("dashboard.subjects")("editSubject")}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id="edit-subject-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <SubjectFormFields control={control} errors={errors} categories={categories} isLoading={isLoading} />
        </Box>
      </DialogContent>
      <SubjectDialogActions onClose={onClose} isLoading={isLoading} />
    </Dialog>
  );
}
