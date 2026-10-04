"use client";

import { Stack, TextField } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { SecretTextField } from "@/frontend/common/components/ui/input";
import {
  type EnvConfigEntryFieldsFragment,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  ProviderConfigFields,
  ProviderOverrideChips,
  ScopesTagInput,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.fields";
import type { CredentialFormValues } from "@/frontend/common/views/dashboard/settings/schemas/credentialForm.schema";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export function CredentialFormFields({
  providerSlugUpper,
  labels,
  register,
  errors,
  control,
  showSecret,
  toggleSecret,
  providerEntries,
  hasExistingCredentials,
  isLoading,
  onRevert,
}: {
  readonly providerSlugUpper: MeetingIntegrationProviderSlug;
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly register: UseFormRegister<CredentialFormValues>;
  readonly errors: FieldErrors<CredentialFormValues>;
  readonly control: Control<CredentialFormValues>;
  readonly showSecret: Record<string, boolean>;
  readonly toggleSecret: (field: string) => void;
  readonly providerEntries: readonly EnvConfigEntryFieldsFragment[];
  readonly hasExistingCredentials: boolean;
  readonly isLoading: boolean;
  readonly onRevert: (key: string) => Promise<void>;
}) {
  const { ref: clientSecretInputRef, ...clientSecretRegistration } = register("clientSecret");
  const { ref: webhookSecretInputRef, ...webhookSecretRegistration } = register("webhookSecret");

  return (
    <Stack sx={{ gap: 2 }}>
      <TextField
        label={labels.credentialForm.clientId}
        {...register("clientId")}
        error={!!errors.clientId}
        helperText={errors.clientId?.message}
        fullWidth
        size="small"
        autoComplete="off"
      />

      <SecretTextField
        label={labels.credentialForm.clientSecret}
        {...clientSecretRegistration}
        inputRef={clientSecretInputRef}
        error={!!errors.clientSecret}
        helperText={errors.clientSecret?.message}
        revealed={showSecret.clientSecret ?? false}
        onToggleReveal={() => toggleSecret("clientSecret")}
        showValueLabel={labels.credentialForm.showValue}
        hideValueLabel={labels.credentialForm.hideValue}
        disabled={isLoading}
      />

      {providerSlugUpper === MeetingIntegrationProviderSlug.MicrosoftTeams ||
      providerSlugUpper === MeetingIntegrationProviderSlug.Zoom ? (
        <ProviderConfigFields
          providerSlug={providerSlugUpper}
          labels={labels.credentialForm}
          register={register}
          errors={errors}
        />
      ) : null}

      <ScopesTagInput labels={labels.credentialForm} control={control} error={errors.scopes?.message} />

      <SecretTextField
        label={labels.credentialForm.webhookSecret}
        {...webhookSecretRegistration}
        inputRef={webhookSecretInputRef}
        error={!!errors.webhookSecret}
        helperText={errors.webhookSecret?.message}
        revealed={showSecret.webhookSecret ?? false}
        onToggleReveal={() => toggleSecret("webhookSecret")}
        showValueLabel={labels.credentialForm.showValue}
        hideValueLabel={labels.credentialForm.hideValue}
        disabled={isLoading}
      />

      {hasExistingCredentials ? (
        <ProviderOverrideChips providerEntries={providerEntries} isLoading={isLoading} onRevert={onRevert} />
      ) : null}
    </Stack>
  );
}
