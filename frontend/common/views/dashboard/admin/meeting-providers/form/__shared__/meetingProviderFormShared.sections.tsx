"use client";

import { Stack, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import { CatalogImageUpload } from "@/frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload";
import { LocalizedStringFormField } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringFormField";
import { TagInput } from "@/frontend/common/components/ui/input/tagInput/TagInput";
import type {
  IdentitySectionProps,
  LogoSectionProps,
  UrlAllowlistSectionProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.types";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";

export function LogoSection({ t, control, isSaving, slots }: Readonly<LogoSectionProps>) {
  const { SectionPanel } = slots;

  return (
    <SectionPanel title={t.fields.logoUrl}>
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
    </SectionPanel>
  );
}

export function IdentitySection({
  t,
  control,
  errors,
  isSaving,
  isEdit,
  slots,
  styles,
}: Readonly<IdentitySectionProps>) {
  const { SectionPanel } = slots;

  return (
    <SectionPanel title={t.fields.name}>
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
    </SectionPanel>
  );
}

export function UrlAllowlistSection({
  t,
  control,
  errors,
  isSaving,
  isUrlExampleValid,
  slots,
  styles,
}: Readonly<UrlAllowlistSectionProps>) {
  const { SectionPanel } = slots;

  return (
    <SectionPanel title={t.fields.urlAllowlist}>
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
    </SectionPanel>
  );
}
