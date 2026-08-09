"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { CatalogImageUpload } from "@/frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload";
import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
import { TagInput } from "@/frontend/common/components/ui/input/tagInput/TagInput";
import type { MeetingProviderFormViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

type MeetingProviderFormSectionProps = Pick<MeetingProviderFormViewProps, "t" | "control" | "errors" | "isSaving">;

function FormSectionPaper({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
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
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function MeetingProviderFormLoadingView({
  title,
  pageSubtitle,
}: Readonly<{
  title: string;
  pageSubtitle: string;
}>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={title} subtitle={pageSubtitle} />
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

function MeetingProviderFormLogoSection({ t, control, isSaving }: Readonly<MeetingProviderFormSectionProps>) {
  return (
    <FormSectionPaper title={t.fields.logoUrl}>
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
    </FormSectionPaper>
  );
}

function MeetingProviderFormIdentitySection({
  t,
  control,
  errors,
  isSaving,
  isEdit,
}: Readonly<MeetingProviderFormSectionProps & { isEdit: boolean }>) {
  return (
    <FormSectionPaper title={t.fields.name}>
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
    </FormSectionPaper>
  );
}

function MeetingProviderFormUrlAllowlistSection({
  t,
  control,
  errors,
  isSaving,
  isUrlExampleValid,
}: Readonly<MeetingProviderFormSectionProps & Pick<MeetingProviderFormViewProps, "isUrlExampleValid">>) {
  return (
    <FormSectionPaper title={t.fields.urlAllowlist}>
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
    </FormSectionPaper>
  );
}

function MeetingProviderFormCapabilitiesSection({
  t,
  control,
  isSaving,
  isActiveValue,
}: Readonly<Pick<MeetingProviderFormViewProps, "t" | "control" | "isSaving"> & { isActiveValue: boolean }>) {
  return (
    <FormSectionPaper title={t.fields.capabilities}>
      <Stack spacing={1.5}>
        <Controller<MeetingProviderFormData, "providerKind">
          name="providerKind"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth disabled={isSaving}>
              <InputLabel>{t.fields.providerKind}</InputLabel>
              <Select {...field} label={t.fields.providerKind}>
                <MenuItem value="manual">{t.fields.providerKindManual}</MenuItem>
                <MenuItem value="zoom_oauth">{t.fields.providerKindZoom}</MenuItem>
                <MenuItem value="google_meet_oauth">{t.fields.providerKindGoogleMeet}</MenuItem>
                <MenuItem value="microsoft_teams_oauth">{t.fields.providerKindTeams}</MenuItem>
              </Select>
            </FormControl>
          )}
        />
        <Controller<MeetingProviderFormData, "supportsUsername">
          name="supportsUsername"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              sx={{ gap: 1, ml: -0.5 }}
              control={
                <Checkbox
                  checked={field.value}
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
                  checked={field.value}
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
                  checked={field.value}
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
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                  disabled={isSaving}
                />
              }
              label={`${t.fields.isActive}: ${isActiveValue ? t.active : t.inactive}`}
            />
          )}
        />
      </Stack>
    </FormSectionPaper>
  );
}

function MeetingProviderFormActionsBar({
  t,
  isSaving,
  slugValue,
  urlAllowlistValue,
  onCancel,
}: Readonly<
  Pick<MeetingProviderFormViewProps, "t" | "isSaving" | "onCancel"> & {
    slugValue: string;
    urlAllowlistValue: string[];
  }
>) {
  return (
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
  );
}

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
    return <MeetingProviderFormLoadingView title={title} pageSubtitle={t.pageSubtitle} />;
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
          <MeetingProviderFormLogoSection t={t} control={control} errors={errors} isSaving={isSaving} />
          <MeetingProviderFormIdentitySection
            t={t}
            control={control}
            errors={errors}
            isSaving={isSaving}
            isEdit={isEdit}
          />
          <MeetingProviderFormUrlAllowlistSection
            t={t}
            control={control}
            errors={errors}
            isSaving={isSaving}
            isUrlExampleValid={isUrlExampleValid}
          />
          <MeetingProviderFormCapabilitiesSection
            t={t}
            control={control}
            isSaving={isSaving}
            isActiveValue={isActiveValue}
          />
          <MeetingProviderFormActionsBar
            t={t}
            isSaving={isSaving}
            slugValue={slugValue}
            urlAllowlistValue={urlAllowlistValue}
            onCancel={onCancel}
          />
        </Stack>
      </Box>
    </DesktopPageContainer>
  );
}
