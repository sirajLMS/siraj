"use client";

import { SendOutlined } from "@mui/icons-material";
import {
  Alert,
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
import type { WhatsappComposerLabels } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

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
  /** True when no conversation is open — a target must be picked/typed. */
  readonly showRecipientPicker: boolean;
  /** True while starting a brand-new thread — text replies need a 24h window. */
  readonly textModeLocked: boolean;
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
  textModeLocked,
  onModeChange,
}: Readonly<Pick<ComposerSharedProps, "labels" | "mode" | "textModeLocked" | "onModeChange">>) {
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
      <ToggleButton value={WhatsappConversationSendMode.Text} disabled={textModeLocked}>
        {labels.composerModeText}
      </ToggleButton>
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

function ModeBody({
  labels,
  mode,
  textBody,
  onTextBodyChange,
  templateName,
  onTemplateNameChange,
  templateLanguage,
  onTemplateLanguageChange,
  windowOpen,
}: Readonly<
  Pick<
    ComposerSharedProps,
    | "labels"
    | "mode"
    | "textBody"
    | "onTextBodyChange"
    | "templateName"
    | "onTemplateNameChange"
    | "templateLanguage"
    | "onTemplateLanguageChange"
    | "windowOpen"
  >
>) {
  if (mode === WhatsappConversationSendMode.Template) {
    return (
      <Stack spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          label={labels.templateNameLabel}
          placeholder={labels.templateNamePlaceholder}
          helperText={labels.composerTemplatePlaceholder}
          value={templateName}
          onChange={event => onTemplateNameChange(event.target.value)}
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
      disabled={!windowOpen}
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
 * window-gated free-text area, template name + language inputs, recipient
 * picker for new conversations (registry-restricted on test numbers), and the
 * send action with localized block reasons and mapped send errors. Initiating
 * a brand-new thread locks the composer to template mode with a heading and
 * the template-required hint.
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
  showRecipientPicker,
  textModeLocked,
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
      {textModeLocked ? <InitiationHeading labels={labels} /> : null}
      <ModeToggle labels={labels} mode={mode} textModeLocked={textModeLocked} onModeChange={onModeChange} />
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
        templateLanguage={templateLanguage}
        onTemplateLanguageChange={onTemplateLanguageChange}
        windowOpen={windowOpen}
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
