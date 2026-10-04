"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { upsertSessionConfigMutationDocument } from "@/frontend/common/graphql/sharedDocuments/settings/session-config.documents";
import { logger } from "@/frontend/common/utils/logger";
import {
  createSessionConfigFormSchema,
  type SessionConfigFormInput,
  type SessionConfigFormValues,
} from "@/frontend/common/views/dashboard/settings/schemas/sessionConfigForm.schema";
import { SessionConfigFormFields } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigFormDialog.parts";
import type { SessionConfigRow } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";

const FORM_ID = "session-config-form";

export interface SessionConfigFormDialogProps {
  readonly open: boolean;
  readonly row: SessionConfigRow | null;
  readonly labels: SettingsSessionTabLabels;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
}

function defaultValues(row: SessionConfigRow | null): SessionConfigFormInput {
  return {
    roleName: row?.roleName ?? "",
    ttlSeconds: row?.ttlSeconds ?? 3600,
    maxConcurrentSessions: row?.maxConcurrentSessions ?? 5,
  };
}

export function SessionConfigFormDialog({
  open,
  row,
  labels,
  onClose,
  onSaved,
}: Readonly<SessionConfigFormDialogProps>) {
  const notifications = useNotifications();
  const isEdit = row != null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionConfigFormInput, undefined, SessionConfigFormValues>({
    resolver: zodResolver(createSessionConfigFormSchema(labels)),
    defaultValues: defaultValues(row),
  });

  const [upsertSessionConfig, { loading }] = useMutation(upsertSessionConfigMutationDocument);

  useEffect(() => {
    if (open) {
      reset(defaultValues(row));
    }
  }, [open, row, reset]);

  const onSubmit = async (values: SessionConfigFormValues): Promise<void> => {
    try {
      await upsertSessionConfig({
        variables: {
          input: {
            roleName: values.roleName.trim(),
            ttlSeconds: values.ttlSeconds,
            maxConcurrentSessions: values.maxConcurrentSessions,
          },
        },
      });
      await onSaved();
    } catch (error) {
      notifications.show(labels.saveError, { severity: "error" });
      logger.error("Failed to upsert session config", { error, roleName: values.roleName });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? labels.editTitle : labels.createTitle}</DialogTitle>
      <DialogContent>
        <Box id={FORM_ID} component="form" onSubmit={handleSubmit(onSubmit)}>
          <SessionConfigFormFields control={control} errors={errors} labels={labels} isEdit={isEdit} />
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
