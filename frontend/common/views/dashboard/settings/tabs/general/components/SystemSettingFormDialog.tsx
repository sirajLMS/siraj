"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { SystemSettingCategory, SystemSettingDataType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { upsertSystemSettingMutationDocument } from "@/frontend/common/graphql/sharedDocuments/settings/general-settings.documents";
import { logger } from "@/frontend/common/utils/logger";
import {
  createSystemSettingFormSchema,
  SYSTEM_SETTING_CATEGORIES,
  SYSTEM_SETTING_DATA_TYPES,
  type SystemSettingFormValues,
} from "@/frontend/common/views/dashboard/settings/schemas/systemSettingForm.schema";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

const FORM_ID = "system-setting-form";

export interface SystemSettingFormDialogProps {
  readonly open: boolean;
  readonly row: SystemSettingRow | null;
  readonly labels: SettingsGeneralTabLabels;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
}

function defaultValues(row: SystemSettingRow | null): SystemSettingFormValues {
  const dataType = row?.dataType ?? SystemSettingDataType.String;
  const category = row?.category ?? SystemSettingCategory.System;
  const value = row?.value ?? "";
  return {
    key: row?.key ?? "",
    value: dataType === SystemSettingDataType.Boolean ? (value === "true" ? "true" : "false") : value,
    dataType,
    description: row?.description ?? "",
    category,
  } as SystemSettingFormValues;
}

export function SystemSettingFormDialog({
  open,
  row,
  labels,
  onClose,
  onSaved,
}: Readonly<SystemSettingFormDialogProps>) {
  const notifications = useNotifications();
  const isEdit = row != null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SystemSettingFormValues>({
    resolver: zodResolver(createSystemSettingFormSchema(labels)),
    defaultValues: defaultValues(row) as SystemSettingFormValues,
  });

  const [upsertSetting, { loading }] = useMutation(upsertSystemSettingMutationDocument);

  const watchedDataType = useWatch({ control, name: "dataType" });

  useEffect(() => {
    if (open) {
      reset(defaultValues(row) as SystemSettingFormValues);
    }
  }, [open, row, reset]);

  const onSubmit = async (values: SystemSettingFormValues): Promise<void> => {
    try {
      await upsertSetting({
        variables: {
          input: {
            key: values.key.trim(),
            value: values.value,
            dataType: values.dataType,
            description: values.description?.trim() || null,
            category: values.category,
          },
        },
      });
      await onSaved();
    } catch (error) {
      notifications.show(labels.saveError, { severity: "error" });
      logger.error("Failed to save system setting", { error, key: values.key });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? labels.editTitle : labels.createTitle}</DialogTitle>
      <DialogContent>
        <Box id={FORM_ID} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller
              name="key"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={labels.keyField}
                  fullWidth
                  required
                  disabled={isEdit}
                  error={Boolean(errors.key)}
                  helperText={errors.key?.message}
                />
              )}
            />

            <Controller
              name="dataType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="system-setting-data-type-label">{labels.dataTypeField}</InputLabel>
                  <Select
                    {...field}
                    labelId="system-setting-data-type-label"
                    label={labels.dataTypeField}
                    value={field.value ?? SystemSettingDataType.String}
                  >
                    {SYSTEM_SETTING_DATA_TYPES.map(dataType => (
                      <MenuItem key={dataType} value={dataType}>
                        {labels.dataTypeLabels[dataType]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {renderValueField({ control, errors, watchedDataType, labels })}

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label={labels.descriptionField} fullWidth multiline minRows={2} />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="system-setting-category-label">{labels.categoryField}</InputLabel>
                  <Select
                    {...field}
                    labelId="system-setting-category-label"
                    label={labels.categoryField}
                    value={field.value ?? SystemSettingCategory.System}
                  >
                    {SYSTEM_SETTING_CATEGORIES.map(category => (
                      <MenuItem key={category} value={category}>
                        {labels.categories[category]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Stack>
        </Box>
      </DialogContent>
      <EntityFormDialogActions
        formId={FORM_ID}
        cancelLabel={labels.cancelLabel}
        saveLabel={labels.saveLabel}
        onClose={onClose}
        isLoading={loading}
      />
    </Dialog>
  );
}

type RenderValueFieldArgs = {
  readonly control: ReturnType<typeof useForm<SystemSettingFormValues>>["control"];
  readonly errors: ReturnType<typeof useForm<SystemSettingFormValues>>["formState"]["errors"];
  readonly watchedDataType: SystemSettingDataType | undefined;
  readonly labels: SettingsGeneralTabLabels;
};

function renderValueField({ control, errors, watchedDataType, labels }: RenderValueFieldArgs) {
  const dataType = watchedDataType ?? SystemSettingDataType.String;

  if (dataType === SystemSettingDataType.Integer) {
    return (
      <Controller
        name="value"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.valueField}
            fullWidth
            required
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            error={Boolean(errors.value)}
            helperText={errors.value?.message}
          />
        )}
      />
    );
  }

  if (dataType === SystemSettingDataType.Boolean) {
    return (
      <Controller
        name="value"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <FormControlLabel
              label={labels.valueField}
              control={
                <Switch
                  checked={field.value === "true"}
                  onChange={event => field.onChange(event.target.checked ? "true" : "false")}
                />
              }
            />
          </FormControl>
        )}
      />
    );
  }

  if (dataType === SystemSettingDataType.Json) {
    return (
      <Controller
        name="value"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.valueField}
            fullWidth
            required
            multiline
            minRows={6}
            slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
            error={Boolean(errors.value)}
            helperText={errors.value?.message}
          />
        )}
      />
    );
  }

  return (
    <Controller
      name="value"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={labels.valueField}
          fullWidth
          required
          multiline
          minRows={2}
          error={Boolean(errors.value)}
          helperText={errors.value?.message}
        />
      )}
    />
  );
}
