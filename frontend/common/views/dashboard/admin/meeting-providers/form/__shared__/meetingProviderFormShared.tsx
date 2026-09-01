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

/* ────────────────────────── Tier-specific slots ────────────────────────── */

interface MeetingProviderFormSharedSlots {
  /** Full page wrapper (DesktopPageContainer or MobilePageContainer). */
  readonly PageContainer: React.ComponentType<{ readonly children: ReactNode }>;
  /** Page header with optional back-button action slot. */
  readonly PageHeader: React.ComponentType<{
    readonly title: string;
    readonly subtitle: string;
    readonly actions?: ReactNode;
  }>;
}

interface MeetingProviderFormSharedStyleProps {
  /** Section paper padding (3 desktop / 2 mobile). */
  readonly sectionPaperPadding: number;
  /** Typography variant for section titles (h6 desktop / subtitle1 mobile). */
  readonly sectionTitleVariant: "h6" | "subtitle1";
  /** Section title bottom margin (2 desktop / 1.5 mobile). */
  readonly sectionTitleMb: number;
  /** Stack spacing between form sections (3 desktop / 2.5 mobile). */
  readonly sectionStackSpacing: number;
  /** Stack spacing inside capabilities section (1.5 desktop / 1 mobile). */
  readonly capabilitiesStackSpacing: number;
  /** Stack spacing inside identity / URL allowlist sections (2 for both). */
  readonly fieldsStackSpacing: number;
  /** Whether action buttons span fullWidth (true mobile / false desktop). */
  readonly actionsFullWidth: boolean;
  /** Actions stack spacing (2 desktop / 1.5 mobile). */
  readonly actionsStackSpacing: number;
  /** Whether actions stack right-justifies (true desktop / false mobile). */
  readonly actionsJustifyEnd: boolean;
  /** Form wrapper sx override (mobile adds px/pb). */
  readonly formSx?: Record<string, unknown>;
  /** Loading skeleton first row height (120 desktop / 100 mobile). */
  readonly loadingFirstHeight: number;
  /** Section paper wrapper for loading state (Paper desktop / Box mobile). */
  readonly LoadingWrapper: React.ComponentType<{ readonly children: ReactNode }>;
  /** Loading wrapper sx override. */
  readonly loadingWrapperSx?: Record<string, unknown>;
}

export interface MeetingProviderFormSharedProps {
  readonly mode: MeetingProviderFormViewProps["mode"];
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly errors: FieldErrors<MeetingProviderFormData>;
  readonly watch: MeetingProviderFormViewProps["watch"];
  readonly isSaving: boolean;
  readonly isLoadingProvider: boolean;
  readonly errorMsg: string | null;
  readonly isUrlExampleValid: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly slots: MeetingProviderFormSharedSlots;
  readonly styles: MeetingProviderFormSharedStyleProps;
  /** Optional back-button element rendered in the page header actions slot. */
  readonly BackAction?: ReactNode;
}

/* ────────────────────────── Shared section types ────────────────────────── */

type SectionFormProps = Pick<MeetingProviderFormSharedProps, "t" | "control" | "errors" | "isSaving" | "styles">;

type LogoSectionProps = Pick<SectionFormProps, "t" | "control" | "isSaving" | "styles">;

type IdentitySectionProps = Pick<SectionFormProps, "t" | "control" | "errors" | "isSaving" | "styles"> & {
  readonly isEdit: boolean;
};

type UrlAllowlistSectionProps = Pick<SectionFormProps, "t" | "control" | "errors" | "isSaving" | "styles"> & {
  readonly isUrlExampleValid: boolean;
};

type CapabilitiesSectionProps = Pick<SectionFormProps, "t" | "control" | "isSaving" | "styles"> & {
  readonly isActiveValue: boolean;
};

type ActionsBarProps = Pick<SectionFormProps, "t" | "isSaving" | "styles"> & {
  readonly slugValue: string;
  readonly urlAllowlistValue: string[];
  readonly onCancel: () => void;
};

/* ────────────────────────── Shared components ────────────────────────── */

function FormSectionPaper({
  title,
  children,
  styles,
}: Readonly<{
  title: string;
  children: ReactNode;
  styles: MeetingProviderFormSharedStyleProps;
}>) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: styles.sectionPaperPadding,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLow,
      })}
    >
      <Typography variant={styles.sectionTitleVariant} sx={{ mb: styles.sectionTitleMb, fontWeight: 600 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function LogoSection({ t, control, isSaving, styles }: Readonly<LogoSectionProps>) {
  return (
    <FormSectionPaper title={t.fields.logoUrl} styles={styles}>
      <Controller<MeetingProviderFormData, "logoUrl">
        name="logoUrl"
        control={control}
        render={({ field }) => (
          <CatalogImageUpload
            imageUrl={field.value ?? null}
            onImageUrlChangeAction={url => field.onChange(url)}
            allowUrlFallback={false}
            disabled={isSaving}
          />
        )}
      />
    </FormSectionPaper>
  );
}

function IdentitySection({ t, control, errors, isSaving, isEdit, styles }: Readonly<IdentitySectionProps>) {
  return (
    <FormSectionPaper title={t.fields.name} styles={styles}>
      <Stack spacing={styles.fieldsStackSpacing}>
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

function UrlAllowlistSection({
  t,
  control,
  errors,
  isSaving,
  isUrlExampleValid,
  styles,
}: Readonly<UrlAllowlistSectionProps>) {
  return (
    <FormSectionPaper title={t.fields.urlAllowlist} styles={styles}>
      <Stack spacing={styles.fieldsStackSpacing}>
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

function CapabilitiesSection({ t, control, isSaving, isActiveValue, styles }: Readonly<CapabilitiesSectionProps>) {
  return (
    <FormSectionPaper title={t.fields.capabilities} styles={styles}>
      <Stack spacing={styles.capabilitiesStackSpacing}>
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

function ActionsBar({ t, isSaving, slugValue, urlAllowlistValue, onCancel, styles }: Readonly<ActionsBarProps>) {
  return (
    <Stack
      direction="row"
      spacing={styles.actionsStackSpacing}
      sx={{ pt: 1, ...(styles.actionsJustifyEnd ? { justifyContent: "flex-end" } : {}) }}
    >
      <Button variant="outlined" onClick={onCancel} disabled={isSaving} fullWidth={styles.actionsFullWidth}>
        {t.cancel}
      </Button>
      <Button
        type="submit"
        variant="contained"
        fullWidth={styles.actionsFullWidth}
        disabled={isSaving || !slugValue.trim() || urlAllowlistValue.length === 0}
        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {isSaving ? t.saving : t.save}
      </Button>
    </Stack>
  );
}

/* ────────────────────────── Form body (shared) ────────────────────────── */

type FormBodyProps = {
  readonly t: MeetingProviderFormViewProps["t"];
  readonly control: Control<MeetingProviderFormData>;
  readonly errors: FieldErrors<MeetingProviderFormData>;
  readonly watch: MeetingProviderFormViewProps["watch"];
  readonly isSaving: boolean;
  readonly errorMsg: string | null;
  readonly isUrlExampleValid: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly styles: MeetingProviderFormSharedStyleProps;
  readonly isEdit: boolean;
  readonly slugValue: string;
  readonly isActiveValue: boolean;
  readonly urlAllowlistValue: string[];
};

function FormBody({
  t,
  control,
  errors,
  isSaving,
  errorMsg,
  isUrlExampleValid,
  onSubmit,
  onCancel,
  styles,
  isEdit,
  slugValue,
  isActiveValue,
  urlAllowlistValue,
}: Readonly<FormBodyProps>) {
  return (
    <Box
      component="form"
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
      sx={styles.formSx ?? {}}
    >
      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      <Stack spacing={styles.sectionStackSpacing}>
        <LogoSection t={t} control={control} isSaving={isSaving} styles={styles} />
        <IdentitySection t={t} control={control} errors={errors} isSaving={isSaving} isEdit={isEdit} styles={styles} />
        <UrlAllowlistSection
          t={t}
          control={control}
          errors={errors}
          isSaving={isSaving}
          isUrlExampleValid={isUrlExampleValid}
          styles={styles}
        />
        <CapabilitiesSection
          t={t}
          control={control}
          isSaving={isSaving}
          isActiveValue={isActiveValue}
          styles={styles}
        />
        <ActionsBar
          t={t}
          isSaving={isSaving}
          slugValue={slugValue}
          urlAllowlistValue={urlAllowlistValue}
          onCancel={onCancel}
          styles={styles}
        />
      </Stack>
    </Box>
  );
}

/* ────────────────────────── Loading state (shared) ────────────────────────── */

const LOADING_ROW_HEIGHTS = [0, 56, 56];

function FormLoadingState({
  title,
  pageSubtitle,
  slots,
  styles,
}: Readonly<{
  title: string;
  pageSubtitle: string;
  slots: MeetingProviderFormSharedSlots;
  styles: MeetingProviderFormSharedStyleProps;
}>) {
  const { PageContainer, PageHeader } = slots;
  const { LoadingWrapper, loadingFirstHeight, loadingWrapperSx } = styles;

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={pageSubtitle} />
      <LoadingWrapper>
        <Stack spacing={2} sx={loadingWrapperSx ?? {}}>
          <Skeleton variant="rectangular" height={loadingFirstHeight} />
          {LOADING_ROW_HEIGHTS.slice(1).map(h => (
            <Skeleton key={h} variant="rectangular" height={h} />
          ))}
        </Stack>
      </LoadingWrapper>
    </PageContainer>
  );
}

/* ────────────────────────── Main scaffold ────────────────────────── */

export function MeetingProviderFormShared({
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
  slots,
  styles,
  BackAction,
}: Readonly<MeetingProviderFormSharedProps>) {
  const isEdit = mode === "edit";
  const title = isEdit ? t.editTitle : t.createTitle;
  const slugValue = watch("slug");
  const isActiveValue = watch("isActive");
  const urlAllowlistValue = watch("urlAllowlist") ?? [];

  if (isLoadingProvider) {
    return <FormLoadingState title={title} pageSubtitle={t.pageSubtitle} slots={slots} styles={styles} />;
  }

  const { PageContainer, PageHeader } = slots;

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={t.pageSubtitle} actions={BackAction} />
      <FormBody
        t={t}
        control={control}
        errors={errors}
        watch={watch}
        isSaving={isSaving}
        errorMsg={errorMsg}
        isUrlExampleValid={isUrlExampleValid}
        onSubmit={onSubmit}
        onCancel={onCancel}
        styles={styles}
        isEdit={isEdit}
        slugValue={slugValue}
        isActiveValue={isActiveValue}
        urlAllowlistValue={urlAllowlistValue}
      />
    </PageContainer>
  );
}
