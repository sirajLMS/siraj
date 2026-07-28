"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { upsertSystemSettingMutationDocument } from "@/frontend/common/graphql/sharedDocuments/settings/general-settings.documents";
import { logger } from "@/frontend/common/utils/logger";
import {
  createSystemSettingFormSchema,
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
  return {
    key: row?.key ?? "",
    value: row?.value ?? "",
    dataType: row?.dataType === "integer" ? "integer" : "string",
    description: row?.description ?? "",
    category: row?.category ?? "",
  };
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
    defaultValues: defaultValues(row),
  });

  const [upsertSetting, { loading }] = useMutation(upsertSystemSettingMutationDocument);

  useEffect(() => {
    if (open) {
      reset(defaultValues(row));
    }
  }, [open, row, reset]);

  const onSubmit = async (values: SystemSettingFormValues): Promise<void> => {
    try {
      await upsertSetting({
        variables: {
          input: {
            key: values.key.trim(),
            value: values.value.trim(),
            dataType: values.dataType,
            description: values.description?.trim() || null,
            category: values.category?.trim() || null,
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
                    value={field.value}
                  >
                    {SYSTEM_SETTING_DATA_TYPES.map(dataType => (
                      <MenuItem key={dataType} value={dataType}>
                        {dataType === "integer" ? labels.dataTypeInteger : labels.dataTypeString}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

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
              render={({ field }) => <TextField {...field} label={labels.categoryField} fullWidth />}
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
