"use client";

import { Autocomplete, type AutocompleteRenderInputParams, Box, Stack, TextField } from "@mui/material";
import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import type { ComposerSharedProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";
import { ComposerTemplateOptionRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerTemplateOptionRow.parts";
import { ComposerTemplatePickerFeedback } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerTemplatePickerFeedback.parts";
import type {
  WhatsappComposerLabels,
  WhatsappTemplateOption,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

type TemplateInputLabels = Readonly<
  Pick<WhatsappComposerLabels, "templatePickerLabel" | "templatePickerPlaceholder" | "composerTemplatePlaceholder">
>;

function getTemplateOptionLabel(option: WhatsappTemplateOption | string): string {
  return typeof option === "string" ? option : option.name;
}

function templateOptionEquals(
  option: WhatsappTemplateOption | string,
  value: WhatsappTemplateOption | string
): boolean {
  if (typeof option === "string" || typeof value === "string") {
    return option === value;
  }
  return option.key === value.key;
}

function renderTemplateInput(params: AutocompleteRenderInputParams, labels: TemplateInputLabels) {
  return (
    <TextField
      {...params}
      label={labels.templatePickerLabel}
      placeholder={labels.templatePickerPlaceholder}
      helperText={labels.composerTemplatePlaceholder}
      slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, dir: "ltr" } }}
    />
  );
}

type ComposerTemplatePickerProps = Readonly<
  Pick<
    ComposerSharedProps,
    | "labels"
    | "templateName"
    | "onTemplateNameChange"
    | "onTemplateSelect"
    | "templateOptions"
    | "templatesLoading"
    | "templatesError"
    | "onRetryTemplates"
    | "templateParamsUnsupportedText"
  >
>;

export function ComposerTemplatePicker({
  labels,
  templateName,
  onTemplateNameChange,
  onTemplateSelect,
  templateOptions,
  templatesLoading,
  templatesError,
  onRetryTemplates,
  templateParamsUnsupportedText,
}: ComposerTemplatePickerProps) {
  return (
    <Stack spacing={1}>
      <Autocomplete<WhatsappTemplateOption, false, false, true>
        freeSolo
        size="small"
        fullWidth
        options={templateOptions}
        getOptionLabel={getTemplateOptionLabel}
        isOptionEqualToValue={templateOptionEquals}
        getOptionDisabled={option => option.paramsCount > 0}
        loading={templatesLoading}
        inputValue={templateName}
        onInputChange={(_event, value, reason) => {
          if (reason === "input") {
            onTemplateNameChange(value);
          }
        }}
        onChange={(_event, option) => {
          if (option === null) {
            onTemplateSelect(null);
            return;
          }
          if (typeof option === "string") {
            return;
          }
          onTemplateSelect(option);
        }}
        noOptionsText={labels.templatePickerEmpty}
        slotProps={{
          popper: createAutocompletePopperSlotProps<WhatsappTemplateOption>({
            matchAnchorWidth: true,
            disablePortal: false,
            listAttached: false,
          }),
          paper: createAutocompletePaperSlotProps<WhatsappTemplateOption>(false),
        }}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <Box key={key} component="li" {...optionProps} dir="ltr" sx={{ unicodeBidi: "isolate" }}>
              <ComposerTemplateOptionRow option={option} unsupportedText={templateParamsUnsupportedText} />
            </Box>
          );
        }}
        renderInput={params => renderTemplateInput(params, labels)}
      />
      <ComposerTemplatePickerFeedback
        labels={labels}
        templatesLoading={templatesLoading}
        templatesError={templatesError}
        onRetryTemplates={onRetryTemplates}
        templateOptions={templateOptions}
      />
    </Stack>
  );
}
