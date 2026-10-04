"use client";

import { Stack, TextField } from "@mui/material";
import { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ComposerSharedProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";
import { ComposerTemplatePicker } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerTemplatePicker.parts";

type ComposerModeBodyProps = Readonly<
  Pick<
    ComposerSharedProps,
    | "labels"
    | "mode"
    | "textBody"
    | "onTextBodyChange"
    | "templateName"
    | "onTemplateNameChange"
    | "onTemplateSelect"
    | "templateOptions"
    | "templatesLoading"
    | "templatesError"
    | "onRetryTemplates"
    | "templateParamsUnsupportedText"
    | "templateLanguage"
    | "onTemplateLanguageChange"
  >
>;

export function ComposerModeBody({
  labels,
  mode,
  textBody,
  onTextBodyChange,
  templateName,
  onTemplateNameChange,
  onTemplateSelect,
  templateOptions,
  templatesLoading,
  templatesError,
  onRetryTemplates,
  templateParamsUnsupportedText,
  templateLanguage,
  onTemplateLanguageChange,
}: ComposerModeBodyProps) {
  if (mode === WhatsappConversationSendMode.Template) {
    return (
      <Stack spacing={1.5}>
        <ComposerTemplatePicker
          labels={labels}
          templateName={templateName}
          onTemplateNameChange={onTemplateNameChange}
          onTemplateSelect={onTemplateSelect}
          templateOptions={templateOptions}
          templatesLoading={templatesLoading}
          templatesError={templatesError}
          onRetryTemplates={onRetryTemplates}
          templateParamsUnsupportedText={templateParamsUnsupportedText}
        />
        <TextField
          size="small"
          label={labels.templateLanguageLabel}
          placeholder={labels.templateLanguagePlaceholder}
          value={templateLanguage}
          onChange={event => onTemplateLanguageChange(event.target.value)}
          slotProps={{ htmlInput: { dir: "ltr" } }}
          sx={{ maxWidth: 220 }}
        />
      </Stack>
    );
  }
  return (
    <TextField
      fullWidth
      multiline
      minRows={2}
      maxRows={6}
      placeholder={labels.composerTextPlaceholder}
      value={textBody}
      onChange={event => onTextBodyChange(event.target.value)}
      slotProps={{ htmlInput: { dir: "auto" } }}
    />
  );
}
