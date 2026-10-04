"use client";

import { Stack, Typography } from "@mui/material";
import { PhoneInput } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";
import { WhatsappRecipientSelect } from "@/frontend/common/views/dashboard/whatsapp/components";
import type { ComposerSharedProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";

type ComposerInitiationHeadingProps = Readonly<Pick<ComposerSharedProps, "labels">>;

export function ComposerInitiationHeading({ labels }: ComposerInitiationHeadingProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="titleLg">{labels.newConversationTitle}</Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.newConversationSubtitle}
      </Typography>
    </Stack>
  );
}

type ComposerRecipientPickerProps = Readonly<
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
>;

export function ComposerRecipientPicker({
  labels,
  showRecipientPicker,
  registryTargetOnly,
  registryTargetPhones,
  recipientSelection,
  onRecipientSelectionChange,
  customRecipient,
  onCustomRecipientChange,
}: ComposerRecipientPickerProps) {
  if (!showRecipientPicker) {
    return null;
  }
  if (registryTargetOnly) {
    return (
      <WhatsappRecipientSelect
        label={labels.composerRecipientLabel}
        placeholder={labels.composerRecipientPlaceholder}
        phones={registryTargetPhones}
        value={recipientSelection}
        onChange={onRecipientSelectionChange}
      />
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
