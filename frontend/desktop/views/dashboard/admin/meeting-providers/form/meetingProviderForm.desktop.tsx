"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { CatalogImageUpload } from "@/frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload";
import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
import { TagInput } from "@/frontend/common/components/ui/input/tagInput/TagInput";
import type { MeetingProviderFormViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

export function MeetingProviderFormDesktopView({
  mode,
  t,
  control,
  errors,
  watch,
  isSaving,
  isLoadingProvider,
  errorMsg,
  isUrlExampleValid,
  onSubmit,
  onCancel,
}: Readonly<MeetingProviderFormViewProps>) {
  const isEdit = mode === "edit";
  const title = isEdit ? t.editTitle : t.createTitle;
  const slugValue = watch("slug");
  const isActiveValue = watch("isActive");
  const urlAllowlistValue = watch("urlAllowlist") ?? [];

  if (isLoadingProvider) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={title} subtitle={t.pageSubtitle} />
        <Paper sx={theme => ({ p: 3, borderRadius: theme.layout.radius.card })}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
          </Stack>
        </Paper>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={title}
        subtitle={t.pageSubtitle}
        actions={
          <Button
            component={Link}
            href="/meeting-providers"
            variant="outlined"
            startIcon={<ArrowBackOutlined />}
            size="small"
          >
            {t.backToProviders}
          </Button>
        }
      />

      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      <Box
        component="form"
        onSubmit={event => {
          event.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <Stack spacing={3}>
          {/* Section 1: Logo Upload */}
          <Paper
            elevation={0}
            sx={theme => ({
              p: 3,
              borderRadius: theme.layout.radius.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surfaceContainerLow,
            })}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t.fields.logoUrl}
            </Typography>
            <Controller<MeetingProviderFormData, "logoUrl">
              name="logoUrl"
              control={control}
              render={({ field }) => (
                <CatalogImageUpload
                  imageUrl={field.value || null}
                  onImageUrlChangeAction={url => field.onChange(url)}
                  allowUrlFallback={false}
                  disabled={isSaving}
                />
              )}
            />
          </Paper>

          {/* Section 2: Identity & Bilingual Information */}
          <Paper
            elevation={0}
            sx={theme => ({
              p: 3,
              borderRadius: theme.layout.radius.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surfaceContainerLow,
            })}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t.fields.name}
            </Typography>
            <Stack spacing={2}>
              <Controller<MeetingProviderFormData, "slug">
                name="slug"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t.fields.slug}
                    fullWidth
                    required
                    disabled={isEdit || isSaving}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? (isEdit ? undefined : t.fields.slugInvalidFormat)}
                  />
                )}
              />

              <LocalizedStringFormField
                name="name"
                control={control}
                label={t.fields.name}
                required
                disabled={isSaving}
                errorMessage={errors.name?.message}
              />

              <LocalizedStringFormField
                name="description"
                control={control}
                label={t.fields.description}
                disabled={isSaving}
                multiline
                minRows={2}
              />

              <LocalizedStringFormField
                name="instructions"
                control={control}
                label={t.fields.instructions}
                disabled={isSaving}
                multiline
                minRows={2}
              />
            </Stack>
          </Paper>

          {/* Section 3: Allowed Hosts & Example URL */}
          <Paper
            elevation={0}
            sx={theme => ({
              p: 3,
              borderRadius: theme.layout.radius.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surfaceContainerLow,
            })}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t.fields.urlAllowlist}
            </Typography>
            <Stack spacing={2}>
              <Controller<MeetingProviderFormData, "urlAllowlist">
                name="urlAllowlist"
                control={control}
                render={({ field }) => (
                  <TagInput
                    label={t.fields.urlAllowlist}
                    placeholder={t.fields.urlAllowlistHelp}
                    initialTags={field.value ?? []}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.urlAllowlist?.message ? (
                <Typography variant="body2" sx={theme => ({ color: theme.palette.error.main })}>
                  {errors.urlAllowlist.message}
                </Typography>
              ) : null}

              <Controller<MeetingProviderFormData, "urlExample">
                name="urlExample"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t.fields.urlExample}
                    fullWidth
                    disabled={isSaving}
                    error={Boolean(fieldState.error) || (!isUrlExampleValid && Boolean(field.value))}
                    helperText={
                      fieldState.error?.message ??
                      (!isUrlExampleValid && field.value ? t.validation.urlAllowlistInvalid : undefined)
                    }
                  />
                )}
              />
            </Stack>
          </Paper>

          {/* Section 4: Capabilities & Active Status */}
          <Paper
            elevation={0}
            sx={theme => ({
              p: 3,
              borderRadius: theme.layout.radius.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surfaceContainerLow,
            })}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t.fields.capabilities}
            </Typography>
            <Stack spacing={1.5}>
              <Controller<MeetingProviderFormData, "supportsUsername">
                name="supportsUsername"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ gap: 1, ml: -0.5 }}
                    control={
                      <Checkbox
                        checked={Boolean(field.value)}
                        onChange={e => field.onChange(e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label={t.fields.supportsUsername}
                  />
                )}
              />
              <Controller<MeetingProviderFormData, "supportsPassword">
                name="supportsPassword"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ gap: 1, ml: -0.5 }}
                    control={
                      <Checkbox
                        checked={Boolean(field.value)}
                        onChange={e => field.onChange(e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label={t.fields.supportsPassword}
                  />
                )}
              />
              <Controller<MeetingProviderFormData, "supportsTenantId">
                name="supportsTenantId"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ gap: 1, ml: -0.5 }}
                    control={
                      <Checkbox
                        checked={Boolean(field.value)}
                        onChange={e => field.onChange(e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label={t.fields.supportsTenantId}
                  />
                )}
              />
              <Controller<MeetingProviderFormData, "isActive">
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ gap: 1.5, ml: 0 }}
                    control={
                      <Switch
                        checked={Boolean(field.value)}
                        onChange={e => field.onChange(e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label={`${t.fields.isActive}: ${isActiveValue ? t.active : t.inactive}`}
                  />
                )}
              />
            </Stack>
          </Paper>

          {/* Actions Bar */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", pt: 1 }}>
            <Button variant="outlined" onClick={onCancel} disabled={isSaving}>
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || !slugValue.trim() || urlAllowlistValue.length === 0}
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSaving ? "..." : t.save}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </DesktopPageContainer>
  );
}
