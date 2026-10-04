"use client";

import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { type Control, Controller, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { TagInput } from "@/frontend/common/components/ui/input";
import {
  type EnvConfigEntryFieldsFragment,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { CredentialFormValues } from "@/frontend/common/views/dashboard/settings/schemas/credentialForm.schema";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export function ScopesTagInput({
  labels,
  control,
  error,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels["credentialForm"];
  readonly control: Control<CredentialFormValues>;
  readonly error?: string;
}) {
  return (
    <Box>
      <Controller<CredentialFormValues, "scopes">
        name="scopes"
        control={control}
        render={({ field }) => (
          <TagInput
            label={labels.scopes}
            placeholder={labels.scopesPlaceholder}
            initialTags={field.value ?? []}
            onChange={field.onChange}
          />
        )}
      />
      {error ? (
        <Typography variant="body2" sx={theme => ({ color: theme.palette.error.main })}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}

export function ProviderConfigFields({
  providerSlug,
  labels,
  register,
  errors,
}: {
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly labels: SettingsMeetingIntegrationsLabels["credentialForm"];
  readonly register: UseFormRegister<CredentialFormValues>;
  readonly errors: FieldErrors<CredentialFormValues>;
}) {
  if (providerSlug === MeetingIntegrationProviderSlug.MicrosoftTeams) {
    return (
      <TextField
        label={labels.tenantId}
        {...register("tenantId")}
        error={!!errors.tenantId}
        helperText={errors.tenantId?.message}
        fullWidth
        size="small"
      />
    );
  }

  if (providerSlug === MeetingIntegrationProviderSlug.Zoom) {
    return (
      <TextField
        label={labels.accountId}
        {...register("accountId")}
        error={!!errors.accountId}
        helperText={errors.accountId?.message}
        fullWidth
        size="small"
      />
    );
  }

  return null;
}

export function ProviderOverrideChips({
  providerEntries,
  isLoading,
  onRevert,
}: {
  readonly providerEntries: readonly EnvConfigEntryFieldsFragment[];
  readonly isLoading: boolean;
  readonly onRevert: (key: string) => Promise<void>;
}) {
  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
      {providerEntries
        .filter(entry => entry.hasDbOverride === true)
        .map(entry => {
          const key = entry.key ?? "";
          return (
            <Chip
              key={key}
              label={key}
              size="small"
              onDelete={() => {
                void onRevert(key);
              }}
              disabled={isLoading}
            />
          );
        })}
    </Stack>
  );
}
