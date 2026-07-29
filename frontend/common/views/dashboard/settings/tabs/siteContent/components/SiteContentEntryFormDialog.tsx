"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { upsertSiteContentMutationDocument } from "@/frontend/common/graphql/sharedDocuments/settings/site-content-settings.documents";
import { logger } from "@/frontend/common/utils/logger";
import {
  type SiteContentFormValues,
  siteContentFormSchema,
} from "@/frontend/common/views/dashboard/settings/schemas/siteContentForm.schema";
import {
  SITE_CONTENT_FORM_ID,
  SiteContentEntryFormFields,
} from "@/frontend/common/views/dashboard/settings/tabs/siteContent/components/SiteContentEntryFormFields";
import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import { buildSiteContentFormDefaults } from "@/frontend/common/views/dashboard/settings/utils/siteContentForm.helpers";
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

export interface SiteContentEntryFormDialogProps {
  readonly open: boolean;
  readonly row: SiteContentRow | null;
  readonly labels: SettingsSiteContentTabLabels;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
}

export function SiteContentEntryFormDialog({
  open,
  row,
  labels,
  onClose,
  onSaved,
}: Readonly<SiteContentEntryFormDialogProps>) {
  const notifications = useNotifications();
  const isEdit = row != null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteContentFormValues>({
    resolver: zodResolver(siteContentFormSchema),
    defaultValues: buildSiteContentFormDefaults(row),
  });

  const [upsertSiteContent, { loading }] = useMutation(upsertSiteContentMutationDocument);

  useEffect(() => {
    if (open) {
      reset(buildSiteContentFormDefaults(row));
    }
  }, [open, row, reset]);

  const onSubmit = async (values: SiteContentFormValues): Promise<void> => {
    try {
      await upsertSiteContent({
        variables: {
          input: {
            slug: values.slug.trim().toLowerCase(),
            title: values.title.trim(),
            body: values.body.trim(),
            contentType: values.contentType,
            isPublished: values.isPublished,
          },
        },
      });
      await onSaved();
    } catch (error) {
      notifications.show(labels.saveError, { severity: "error" });
      logger.error("Failed to save site content", { error, slug: values.slug });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? labels.editTitle : labels.createTitle}</DialogTitle>
      <DialogContent>
        <SiteContentEntryFormFields
          formId={SITE_CONTENT_FORM_ID}
          control={control}
          errors={errors}
          labels={labels}
          isEdit={isEdit}
          onSubmit={onSubmit}
          handleSubmit={handleSubmit}
        />
      </DialogContent>
      <EntityFormDialogActions
        formId={SITE_CONTENT_FORM_ID}
        cancelLabel={labels.cancelLabel}
        saveLabel={labels.saveLabel}
        onClose={onClose}
        isLoading={loading}
      />
    </Dialog>
  );
}
