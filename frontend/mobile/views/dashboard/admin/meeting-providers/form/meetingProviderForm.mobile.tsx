"use client";

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
import type { ReactNode } from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { CatalogImageUpload } from "@/frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload";
import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
import { TagInput } from "@/frontend/common/components/ui/input/tagInput/TagInput";
import type { MeetingProviderFormViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

type FormSectionPaperProps = {
  readonly title: string;
  readonly children: ReactNode;
};

function FormSectionPaper({ title, children }: Readonly<FormSectionPaperProps>) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 2,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLow,
      })}
    >
      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

type LoadingStateProps = {
  readonly title: string;
  readonly pageSubtitle: string;
};

function MeetingProviderFormLoadingState({ title, pageSubtitle }: Readonly<LoadingStateProps>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={title} subtitle={pageSubtitle} />
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
        </Stack>
      </Box>
    </MobilePageContainer>
  );
}

type LogoUploadSectionProps = {
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly isSaving: boolean;
};

function LogoUploadSection({ t, control, isSaving }: Readonly<LogoUploadSectionProps>) {
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

type IdentityDetailsSectionProps = {
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly errors: FieldErrors<MeetingProviderFormData>;
  readonly isEdit: boolean;
  readonly isSaving: boolean;
};

function IdentityDetailsSection({ t, control, errors, isEdit, isSaving }: Readonly<IdentityDetailsSectionProps>) {
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

type UrlAllowlistSectionProps = {
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly errors: FieldErrors<MeetingProviderFormData>;
  readonly isSaving: boolean;
  readonly isUrlExampleValid: boolean;
};

function UrlAllowlistSection({ t, control, errors, isSaving, isUrlExampleValid }: Readonly<UrlAllowlistSectionProps>) {
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

type CapabilitiesSectionProps = {
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly isSaving: boolean;
  readonly isActiveValue: boolean;
};

function CapabilitiesSection({ t, control, isSaving, isActiveValue }: Readonly<CapabilitiesSectionProps>) {
  return (
    <FormSectionPaper title={t.fields.capabilities}>
      <Stack spacing={1}>
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
                <Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
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
                <Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
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
                <Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
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
                <Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} disabled={isSaving} />
              }
              label={`${t.fields.isActive}: ${isActiveValue ? t.active : t.inactive}`}
            />
          )}
        />
      </Stack>
    </FormSectionPaper>
  );
}

type FormActionsProps = {
  readonly t: MeetingProviderFormViewProps["t"];
  readonly isSaving: boolean;
  readonly slugValue: string;
  readonly urlAllowlistValue: string[];
  readonly onCancel: () => void;
};

function FormActions({ t, isSaving, slugValue, urlAllowlistValue, onCancel }: Readonly<FormActionsProps>) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
      <Button variant="outlined" fullWidth onClick={onCancel} disabled={isSaving}>
        {t.cancel}
      </Button>
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isSaving || !slugValue.trim() || urlAllowlistValue.length === 0}
        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {isSaving ? "..." : t.save}
      </Button>
    </Stack>
  );
}

type MeetingProviderFormBodyProps = Pick<
  MeetingProviderFormViewProps,
  "t" | "control" | "errors" | "watch" | "isSaving" | "errorMsg" | "isUrlExampleValid" | "onSubmit" | "onCancel"
> & {
  readonly isEdit: boolean;
};

function MeetingProviderFormBody({
  t,
  control,
  errors,
  watch,
  isSaving,
  errorMsg,
  isUrlExampleValid,
  onSubmit,
  onCancel,
  isEdit,
}: Readonly<MeetingProviderFormBodyProps>) {
  const slugValue = watch("slug");
  const isActiveValue = watch("isActive");
  const urlAllowlistValue = watch("urlAllowlist") ?? [];

  return (
    <Box
      component="form"
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
      sx={{ px: 2, pb: 4 }}
    >
      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      <Stack spacing={2.5}>
        <LogoUploadSection t={t} control={control} isSaving={isSaving} />
        <IdentityDetailsSection t={t} control={control} errors={errors} isEdit={isEdit} isSaving={isSaving} />
        <UrlAllowlistSection
          t={t}
          control={control}
          errors={errors}
          isSaving={isSaving}
          isUrlExampleValid={isUrlExampleValid}
        />
        <CapabilitiesSection t={t} control={control} isSaving={isSaving} isActiveValue={isActiveValue} />
        <FormActions
          t={t}
          isSaving={isSaving}
          slugValue={slugValue}
          urlAllowlistValue={urlAllowlistValue}
          onCancel={onCancel}
        />
      </Stack>
    </Box>
  );
}

export function MeetingProviderFormMobileView({
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

  if (isLoadingProvider) {
    return <MeetingProviderFormLoadingState title={title} pageSubtitle={t.pageSubtitle} />;
  }

  return (
    <MobilePageContainer>
      <MobilePageHeader title={title} subtitle={t.pageSubtitle} />
      <MeetingProviderFormBody
        t={t}
        control={control}
        errors={errors}
        watch={watch}
        isSaving={isSaving}
        errorMsg={errorMsg}
        isUrlExampleValid={isUrlExampleValid}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isEdit={isEdit}
      />
    </MobilePageContainer>
  );
}
