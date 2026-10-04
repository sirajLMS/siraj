"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  generateMeetingUrlMutationDocument,
  updateUserMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { logger } from "@/frontend/common/utils/logger";
import {
  findConfigSlugByProviderId,
  type GeneratePreviewArgs,
  type GenerationStatus,
  isProviderReauthError,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManager.helpers";

interface PreviewArgs {
  readonly configs: readonly UserMeetingConfigFieldsFragment[];
  readonly saveErrorLabel: string;
  readonly addReactiveSlug: (slug: string) => void;
  readonly removeReactiveSlug: (slug: string) => void;
}

/** Owns the meeting-URL preview generation flow: calls the generate mutation
 *  on demand, tracks status/generated-URL/error state, and clears reactive
 *  reauth flags when a provider proves its token works again. */
export function useMeetingConfigsManagerPreview({
  configs,
  saveErrorLabel,
  addReactiveSlug,
  removeReactiveSlug,
}: PreviewArgs) {
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generateMeetingUrl] = useMutation(generateMeetingUrlMutationDocument);

  const generatePreview = async (args: GeneratePreviewArgs): Promise<string | null> => {
    setGenerationStatus("generating");
    setGenerationError(null);
    try {
      const result = await generateMeetingUrl({
        variables: {
          input: {
            providerId: args.providerId,
            topic: args.topic,
            startDateTime: args.startDateTime ?? null,
            durationMinutes: args.durationMinutes ?? null,
          },
        },
      });
      const joinUrl = result.data?.generateMeetingUrl?.joinUrl ?? null;
      if (joinUrl) {
        setLastGeneratedUrl(joinUrl);
        setGenerationStatus("success");
        const slug = findConfigSlugByProviderId(configs, args.providerId);
        if (slug) removeReactiveSlug(slug);
        return joinUrl;
      }
      setGenerationStatus("error");
      setGenerationError(saveErrorLabel);
      return null;
    } catch (caughtError) {
      setGenerationStatus("error");
      if (isProviderReauthError(caughtError)) {
        const slug = findConfigSlugByProviderId(configs, args.providerId);
        if (slug) {
          addReactiveSlug(slug);
        }
      }
      setGenerationError(saveErrorLabel);
      return null;
    }
  };

  const resetGeneration = () => {
    setGenerationStatus("idle");
    setLastGeneratedUrl(null);
    setGenerationError(null);
  };

  return {
    view: { generationStatus, lastGeneratedUrl, generationError, generatePreview, resetGeneration },
  };
}

interface RegenerateArgs {
  readonly configById: ReadonlyMap<string, UserMeetingConfigFieldsFragment>;
  readonly refetch: () => Promise<unknown>;
  readonly saveErrorLabel: string;
  readonly addReactiveSlug: (slug: string) => void;
  readonly setErrorMessage: (message: string | null) => void;
}

/** Owns the "regenerate URL" row action: re-saves the config with
 *  `forceRegenerate` so the backend issues a fresh meeting URL, surfacing
 *  failures on the manager error snackbar. */
export function useMeetingConfigsManagerRegenerate({
  configById,
  refetch,
  saveErrorLabel,
  addReactiveSlug,
  setErrorMessage,
}: RegenerateArgs) {
  const [generating, setGenerating] = useState(false);
  const [updateUserMeetingConfig] = useMutation(updateUserMeetingConfigMutationDocument);

  const regenerateConfig = async (configId: string): Promise<void> => {
    const config = configById.get(configId);
    if (!config) return;
    const providerId = config.provider?.id;
    if (!providerId) return;

    setGenerating(true);
    setErrorMessage(null);
    try {
      await updateUserMeetingConfig({
        variables: {
          id: configId,
          input: {
            details: {
              meetingUrl: config.details?.meetingUrl ?? null,
              tenantId: config.details?.tenantId ?? null,
              username: config.details?.username ?? null,
            },
            isDefault: config.isDefault ?? null,
            label: config.label ?? null,
            password: null,
            providerId: config.provider?.id ?? null,
            forceRegenerate: true,
          },
        },
      });
      await refetch();
    } catch (caughtError) {
      if (isProviderReauthError(caughtError)) {
        const slug = config.provider?.slug;
        if (slug) {
          addReactiveSlug(slug);
        }
      }
      logger.error("regenerateConfig failed", caughtError);
      setErrorMessage(saveErrorLabel);
    } finally {
      setGenerating(false);
    }
  };

  return { view: { regenerateConfig, generating } };
}
