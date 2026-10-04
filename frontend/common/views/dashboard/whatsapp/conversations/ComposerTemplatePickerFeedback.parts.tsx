"use client";

import { Alert, Button, Typography } from "@mui/material";
import type { ComposerSharedProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";

type ComposerTemplatePickerFeedbackProps = Readonly<
  Pick<ComposerSharedProps, "labels" | "templatesLoading" | "templatesError" | "onRetryTemplates" | "templateOptions">
>;

export function ComposerTemplatePickerFeedback({
  labels,
  templatesLoading,
  templatesError,
  onRetryTemplates,
  templateOptions,
}: ComposerTemplatePickerFeedbackProps) {
  if (templatesError) {
    return (
      <Alert
        severity="warning"
        component="div"
        action={
          <Button color="inherit" size="small" onClick={onRetryTemplates}>
            {labels.templatePickerRetry}
          </Button>
        }
      >
        {labels.templatePickerError}
      </Alert>
    );
  }
  // freeSolo suppresses the popup's noOptionsText, so the empty state is surfaced inline instead.
  if (!templatesLoading && templateOptions.length === 0) {
    return (
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.templatePickerEmpty}
      </Typography>
    );
  }
  return null;
}
