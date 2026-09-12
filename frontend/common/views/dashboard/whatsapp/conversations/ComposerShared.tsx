"use client";

import { SendOutlined } from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { PhoneInput } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";
import { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  WhatsappComposerLabels,
  WhatsappTemplateOption,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

export interface ComposerSharedProps {
  readonly labels: WhatsappComposerLabels;
  readonly mode: WhatsappConversationSendMode;
  readonly onModeChange: (mode: WhatsappConversationSendMode) => void;
  readonly textBody: string;
  readonly onTextBodyChange: (value: string) => void;
  readonly templateName: string;
  readonly onTemplateNameChange: (value: string) => void;
  readonly templateLanguage: string;
  readonly onTemplateLanguageChange: (value: string) => void;
  readonly templateOptions: readonly WhatsappTemplateOption[];
  readonly templatesLoading: boolean;
  readonly templatesError: boolean;
  readonly onRetryTemplates: () => void;
  readonly onTemplateSelect: (option: WhatsappTemplateOption | null) => void;
  /** Note shown on picker rows whose variables the composer cannot fill. */
  readonly templateParamsUnsupportedText: string;
  /** True when no conversation is open — a target must be picked/typed. */
  readonly showRecipientPicker: boolean;
  /** On test numbers the target must come from the local registry. */
  readonly registryTargetOnly: boolean;
  readonly registryTargetPhones: readonly string[];
  readonly recipientSelection: string;
  readonly onRecipientSelectionChange: (value: string) => void;
  readonly customRecipient: string;
  readonly onCustomRecipientChange: (value: string) => void;
  readonly windowOpen: boolean;
  readonly windowStatusHint: string;
  /** Already-translated reason the send action is unavailable, when any. */
  readonly sendBlockReason: string | null;
  readonly sendDisabled: boolean;
  readonly sendError: string | null;
  readonly sending: boolean;
  readonly onSend: () => void;
}

function ModeToggle({
  labels,
  mode,
  onModeChange,
}: Readonly<Pick<ComposerSharedProps, "labels" | "mode" | "onModeChange">>) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={mode}
      aria-label={labels.composerModeLabel}
      onChange={(_event, next: WhatsappConversationSendMode | null) => {
        if (next !== null) {
          onModeChange(next);
        }
      }}
    >
      <ToggleButton value={WhatsappConversationSendMode.Text}>{labels.composerModeText}</ToggleButton>
      <ToggleButton value={WhatsappConversationSendMode.Template}>{labels.composerModeTemplate}</ToggleButton>
    </ToggleButtonGroup>
  );
}

function RecipientPicker({
  labels,
  showRecipientPicker,
  registryTargetOnly,
  registryTargetPhones,
  recipientSelection,
  onRecipientSelectionChange,
  customRecipient,
  onCustomRecipientChange,
}: Readonly<
  Pick<
    ComposerSharedProps,
    | "labels"
    | "showRecipientPicker"
    | "registryTargetOnly"
    | "registryTargetPhones"
    | "recipientSelection"
    | "onRecipientSelectionChange"
    | "customRecipient"
    | "onCustomRecipientChange"
  >
>) {
  if (!showRecipientPicker) {
    return null;
  }
  if (registryTargetOnly) {
    return (
      <FormControl size="small" fullWidth>
        <InputLabel id="whatsapp-conversations-recipient-select">{labels.composerRecipientLabel}</InputLabel>
        <Select
          labelId="whatsapp-conversations-recipient-select"
          value={recipientSelection}
          label={labels.composerRecipientLabel}
          displayEmpty
          onChange={event => onRecipientSelectionChange(event.target.value)}
        >
          <MenuItem value="" disabled>
            {labels.composerRecipientPlaceholder}
          </MenuItem>
          {registryTargetPhones.map(phone => (
            <MenuItem key={phone} value={phone} dir="ltr" sx={{ unicodeBidi: "isolate" }}>
              {phone}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
  return (
    <PhoneInput
      label={labels.composerRecipientLabel}
      placeholder={labels.composerRecipientPlaceholder}
      value={customRecipient === "" ? null : customRecipient}
      onChangeAction={value => onCustomRecipientChange(value ?? "")}
      fullWidth
    />
  );
}

function TemplatePicker({
  labels,
  templateName,
  onTemplateNameChange,
  onTemplateSelect,
  templateOptions,
  templatesLoading,
  templatesError,
  onRetryTemplates,
  templateParamsUnsupportedText,
}: Readonly<
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
>) {
  return (
    <Stack spacing={1}>
      <Autocomplete<WhatsappTemplateOption, false, false, true>
        freeSolo
        size="small"
        fullWidth
        options={templateOptions}
        getOptionLabel={option => (typeof option === "string" ? option : option.name)}
        isOptionEqualToValue={(option, value) => {
          if (typeof option === "string" || typeof value === "string") {
            return option === value;
          }
          return option.key === value.key;
        }}
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
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <Box key={key} component="li" {...optionProps} dir="ltr" sx={{ unicodeBidi: "isolate" }}>
              <Stack spacing={0}>
                <Typography variant="bodyMd">{`${option.name} · ${option.language}`}</Typography>
                {option.paramsCount > 0 ? (
                  <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
                    {templateParamsUnsupportedText}
                  </Typography>
                ) : null}
                {option.paramsCount === 0 && option.bodyText !== "" ? (
                  <Typography variant="bodyMd" noWrap sx={{ color: theme => theme.palette.text.secondary }}>
                    {option.bodyText}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          );
        }}
        renderInput={params => (
          <TextField
            {...params}
            label={labels.templatePickerLabel}
            placeholder={labels.templatePickerPlaceholder}
            helperText={labels.composerTemplatePlaceholder}
            slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, dir: "ltr" } }}
          />
        )}
      />
      {templatesError ? (
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
      ) : null}
      {/* freeSolo suppresses the popup's noOptionsText, so the empty state is surfaced inline instead. */}
      {!templatesLoading && !templatesError && templateOptions.length === 0 ? (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.templatePickerEmpty}
        </Typography>
      ) : null}
    </Stack>
  );
}

function ModeBody({
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
}: Readonly<
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
>) {
  if (mode === WhatsappConversationSendMode.Template) {
    return (
      <Stack spacing={1.5}>
        <TemplatePicker
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

function InitiationHeading({ labels }: Readonly<Pick<ComposerSharedProps, "labels">>) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="titleLg">{labels.newConversationTitle}</Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.newConversationSubtitle}
      </Typography>
    </Stack>
  );
}

/**
 * Message composer for the `/whatsapp` workspace: text/template mode toggle,
 * advisory window hint, approved-template picker (live from Meta, with
 * freeSolo fallback for manual names) plus a language input, recipient picker
 * for new conversations (registry-restricted on test numbers), and the send
 * action with localized block reasons and mapped send errors. The 24h window
 * is advisory only — Meta is the authoritative gate and rejects out-of-window
 * sends with WHATSAPP_OUTSIDE_SERVICE_WINDOW.
 */
export function ComposerShared({
  labels,
  mode,
  onModeChange,
  textBody,
  onTextBodyChange,
  templateName,
  onTemplateNameChange,
  templateLanguage,
  onTemplateLanguageChange,
  templateOptions,
  templatesLoading,
  templatesError,
  onRetryTemplates,
  onTemplateSelect,
  templateParamsUnsupportedText,
  showRecipientPicker,
  registryTargetOnly,
  registryTargetPhones,
  recipientSelection,
  onRecipientSelectionChange,
  customRecipient,
  onCustomRecipientChange,
  windowOpen,
  windowStatusHint,
  sendBlockReason,
  sendDisabled,
  sendError,
  sending,
  onSend,
}: Readonly<ComposerSharedProps>) {
  const showWindowHint = windowStatusHint !== "" && mode === WhatsappConversationSendMode.Text;
  const isWindowClosedHint = !windowOpen && !showRecipientPicker && showWindowHint;
  return (
    <Stack spacing={1.5}>
      {showRecipientPicker ? <InitiationHeading labels={labels} /> : null}
      <ModeToggle labels={labels} mode={mode} onModeChange={onModeChange} />
      <RecipientPicker
        labels={labels}
        showRecipientPicker={showRecipientPicker}
        registryTargetOnly={registryTargetOnly}
        registryTargetPhones={registryTargetPhones}
        recipientSelection={recipientSelection}
        onRecipientSelectionChange={onRecipientSelectionChange}
        customRecipient={customRecipient}
        onCustomRecipientChange={onCustomRecipientChange}
      />
      <ModeBody
        labels={labels}
        mode={mode}
        textBody={textBody}
        onTextBodyChange={onTextBodyChange}
        templateName={templateName}
        onTemplateNameChange={onTemplateNameChange}
        onTemplateSelect={onTemplateSelect}
        templateOptions={templateOptions}
        templatesLoading={templatesLoading}
        templatesError={templatesError}
        onRetryTemplates={onRetryTemplates}
        templateParamsUnsupportedText={templateParamsUnsupportedText}
        templateLanguage={templateLanguage}
        onTemplateLanguageChange={onTemplateLanguageChange}
      />
      {showWindowHint && (
        <Typography
          variant="bodyMd"
          sx={{ color: theme => (isWindowClosedHint ? theme.palette.warning.main : theme.palette.text.secondary) }}
        >
          {windowStatusHint}
        </Typography>
      )}
      {sendBlockReason !== null && sendBlockReason !== "" && (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.warning.main }}>
          {sendBlockReason}
        </Typography>
      )}
      {sendError !== null && (
        <Alert severity="error" component="div">
          <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
            {labels.sendErrorTitle}
          </Typography>
          <Typography variant="bodyMd">{sendError}</Typography>
        </Alert>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={onSend}
          disabled={sending || sendDisabled}
          startIcon={sending ? <CircularProgress size={16} /> : <SendOutlined />}
        >
          {labels.sendButton}
        </Button>
      </Box>
    </Stack>
  );
}
