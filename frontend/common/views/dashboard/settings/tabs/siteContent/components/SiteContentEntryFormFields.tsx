"use client";

import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  SITE_CONTENT_TYPES,
  type SiteContentFormValues,
} from "@/frontend/common/views/dashboard/settings/schemas/siteContentForm.schema";
import { resolveSiteContentFieldError } from "@/frontend/common/views/dashboard/settings/utils/siteContentForm.helpers";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

export const SITE_CONTENT_FORM_ID = "site-content-form";

type SiteContentEntryFormFieldsProps = {
  readonly formId: string;
  readonly control: Control<SiteContentFormValues>;
  readonly errors: FieldErrors<SiteContentFormValues>;
  readonly labels: SettingsSiteContentTabLabels;
  readonly isEdit: boolean;
  readonly onSubmit: (values: SiteContentFormValues) => Promise<void>;
  readonly handleSubmit: (
    onValid: (values: SiteContentFormValues) => Promise<void>
  ) => (event?: React.BaseSyntheticEvent) => Promise<void>;
};

export function SiteContentEntryFormFields({
  formId,
  control,
  errors,
  labels,
  isEdit,
  onSubmit,
  handleSubmit,
}: Readonly<SiteContentEntryFormFieldsProps>) {
  return (
    <Stack
      id={formId}
      component="form"
      spacing={2}
      sx={{ pt: 1 }}
      onSubmit={event => {
        event.preventDefault();
        handleSubmit(onSubmit)(event).catch(() => undefined);
      }}
    >
      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.slugField}
            fullWidth
            required
            disabled={isEdit}
            error={Boolean(errors.slug)}
            helperText={resolveSiteContentFieldError(errors.slug?.message, labels, "slug")}
          />
        )}
      />

      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.titleField}
            fullWidth
            required
            error={Boolean(errors.title)}
            helperText={resolveSiteContentFieldError(errors.title?.message, labels, "title")}
          />
        )}
      />

      <Controller
        name="body"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.bodyField}
            fullWidth
            required
            multiline
            minRows={6}
            error={Boolean(errors.body)}
            helperText={resolveSiteContentFieldError(errors.body?.message, labels, "body")}
          />
        )}
      />

      <Controller
        name="contentType"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel id="site-content-type-label">{labels.contentTypeField}</InputLabel>
            <Select {...field} labelId="site-content-type-label" label={labels.contentTypeField} value={field.value}>
              {SITE_CONTENT_TYPES.map(contentType => (
                <MenuItem key={contentType} value={contentType}>
                  {contentType === "page" ? labels.contentTypePage : contentType}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <Controller
        name="isPublished"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={field.value} onChange={field.onChange} />}
            label={labels.publishedField}
          />
        )}
      />
    </Stack>
  );
}
