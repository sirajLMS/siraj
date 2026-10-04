"use client";

import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { envConfigEntriesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import {
  applyResetDraftValues,
  buildDefaultValues,
  FORM_ID_PREFIX,
  filterProviderEntries,
  hasEnvOverride,
  parseScopesFromEntries,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.helpers";
import {
  useCredentialFormMutations,
  useSecretVisibility,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.hooks";
import { CredentialFormFields } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.parts";
import { renderCredentialFormEarlyState } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.states";
import {
  type CredentialFormValues,
  createCredentialFormSchema,
} from "@/frontend/common/views/dashboard/settings/schemas/credentialForm.schema";
import type { MeetingIntegrationProviderSummary } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export function MeetingProviderCredentialForm({
  provider,
  labels,
}: {
  readonly provider: MeetingIntegrationProviderSummary;
  readonly labels: SettingsMeetingIntegrationsLabels;
}) {
  const notifications = useNotifications();
  const router = useRouter();
  const { showSecret, toggleSecret } = useSecretVisibility();

  const { data, loading, error } = useQuery(envConfigEntriesQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const providerSlugUpper = provider.slug;

  const providerEntries = useMemo(
    () => filterProviderEntries(data?.envConfigEntries ?? [], providerSlugUpper),
    [data?.envConfigEntries, providerSlugUpper]
  );

  const schema = useMemo(
    () =>
      createCredentialFormSchema({
        clientIdRequired: labels.clientIdRequired,
        clientSecretRequired: labels.clientSecretRequired,
        scopesRequired: labels.scopesRequired,
      }),
    [labels.clientIdRequired, labels.clientSecretRequired, labels.scopesRequired]
  );

  const hasExistingCredentials = useMemo(
    () => hasEnvOverride(providerEntries, `${providerSlugUpper}_CLIENT_ID`),
    [providerEntries, providerSlugUpper]
  );

  const initialScopes = useMemo(
    () => parseScopesFromEntries(providerEntries, providerSlugUpper),
    [providerEntries, providerSlugUpper]
  );

  const defaultValues = useMemo(
    () => buildDefaultValues(providerEntries, providerSlugUpper, initialScopes),
    [providerEntries, providerSlugUpper, initialScopes]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CredentialFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (!loading && providerEntries.length > 0) {
      reset(defaultValues);
    }
  }, [loading, providerEntries.length, defaultValues, reset]);

  const { onSubmit, onRevert, isReverting } = useCredentialFormMutations(
    providerSlugUpper,
    setValue,
    notifications,
    router,
    labels
  );

  const earlyReturn = renderCredentialFormEarlyState(loading, error, providerEntries, hasExistingCredentials, labels);
  if (earlyReturn) {
    return earlyReturn;
  }

  const formId = `${FORM_ID_PREFIX}${providerSlugUpper}`;
  const isLoading = isSubmitting || isReverting;

  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 1 })}>
        {hasExistingCredentials ? labels.credentialFormEditTitle : labels.credentialFormCreateTitle}
      </Typography>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <CredentialFormFields
          providerSlugUpper={providerSlugUpper}
          labels={labels}
          register={register}
          errors={errors}
          control={control}
          showSecret={showSecret}
          toggleSecret={toggleSecret}
          providerEntries={providerEntries}
          hasExistingCredentials={hasExistingCredentials}
          isLoading={isLoading}
          onRevert={onRevert}
        />
      </form>

      <EntityFormDialogActions
        formId={formId}
        cancelLabel={labels.actions.cancel}
        saveLabel={isSubmitting ? labels.credentialForm.saving : labels.credentialForm.save}
        onClose={() => {
          applyResetDraftValues(setValue, providerEntries, providerSlugUpper, initialScopes);
        }}
        isLoading={isLoading}
      />
    </Box>
  );
}
