import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import {
  publishAppearanceMutationDocument,
  resetAppearanceDraftMutationDocument,
  saveAppearanceDraftMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { useAppearanceLogoUpload } from "@/frontend/common/hooks/useAppearanceLogoUpload";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";
import { prepareDraftForAction } from "@/frontend/common/views/dashboard/appearance/shared/resolveDraftLogoForSave";
import type { SettingsAppearanceTabLabels } from "@/shared/locale/types/dashboard/settings/appearance";

/** Toast callback shared by every appearance settings action. */
type AppearanceNotify = (message: string, severity: "success" | "error") => void;

/**
 * Prepares the in-memory draft for persistence (resolving any data-URL logo
 * to a storage URL first) and saves it as the server draft.
 *
 * The publish flow reuses this before promoting the draft so the published
 * row always reflects what the admin sees on screen; `onlyWhenDirty` lets it
 * skip the save mutation when there is nothing pending to persist.
 */
export function useAppearanceDraftPersistence() {
  const draft = useAppearancePreviewStore(s => s.draft);
  const dirty = useAppearancePreviewStore(s => s.dirty);
  const setField = useAppearancePreviewStore(s => s.setField);
  const { uploadLogo } = useAppearanceLogoUpload();
  const [saveDraft, { loading: saveDraftLoading }] = useMutation(saveAppearanceDraftMutationDocument);

  const persistDraft = async ({ onlyWhenDirty }: { readonly onlyWhenDirty: boolean }) => {
    const input = await prepareDraftForAction(draft, uploadLogo, setField);
    if (!onlyWhenDirty || dirty) {
      await saveDraft({ variables: { input, expectedUpdatedAt: undefined } });
    }
    return input;
  };

  return { dirty, saveDraftLoading, persistDraft };
}

type AppearanceDraftPersistence = ReturnType<typeof useAppearanceDraftPersistence>;

type UseSaveAppearanceDraftActionParams = {
  readonly labels: SettingsAppearanceTabLabels;
  readonly notify: AppearanceNotify;
  readonly persistence: AppearanceDraftPersistence;
};

/** Saves the current draft to the server and toasts the outcome. */
export function useSaveAppearanceDraftAction({ labels, notify, persistence }: UseSaveAppearanceDraftActionParams) {
  const markSaved = useAppearancePreviewStore(s => s.markSaved);

  const onSaveDraft = async () => {
    try {
      await persistence.persistDraft({ onlyWhenDirty: false });
      markSaved();
      notify(labels.saveDraftSuccess, "success");
    } catch (error) {
      logger.error("Failed to save appearance draft from settings tab", { error });
      notify(labels.saveDraftError, "error");
    }
  };

  return { onSaveDraft };
}

type UsePublishAppearanceActionParams = {
  readonly labels: SettingsAppearanceTabLabels;
  readonly notify: AppearanceNotify;
  readonly persistence: AppearanceDraftPersistence;
};

/**
 * Promotes the draft to the published row: persists pending edits into the
 * server draft, publishes, snapshots the result for customize-mode
 * exit-restore, and refreshes the route so server-rendered surfaces (theme
 * stylesheet, metadata) pick up the newly published row without a reload.
 */
export function usePublishAppearanceAction({ labels, notify, persistence }: UsePublishAppearanceActionParams) {
  const router = useRouter();
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const markPublished = useAppearancePreviewStore(s => s.markPublished);
  const [publish, { loading: publishLoading }] = useMutation(publishAppearanceMutationDocument);

  const onPublish = async () => {
    try {
      const input = await persistence.persistDraft({ onlyWhenDirty: true });
      await publish({ variables: { expectedUpdatedAt: undefined } });
      markSaved();
      markPublished(input);
      router.refresh();
      notify(labels.publishSuccess, "success");
    } catch (error) {
      logger.error("Failed to publish appearance from settings tab", { error });
      notify(labels.publishError, "error");
    }
  };

  return { onPublish, publishLoading };
}

type UseResetAppearanceDraftActionParams = {
  readonly labels: SettingsAppearanceTabLabels;
  readonly notify: AppearanceNotify;
};

/**
 * Confirms the reset dialog: closes it, discards the server draft (which
 * falls back to the published row), and clears the local dirty flag. The
 * customizer re-syncs from the refetched `appearanceSettings` query when it
 * next mounts.
 */
export function useResetAppearanceDraftAction({ labels, notify }: UseResetAppearanceDraftActionParams) {
  const closeResetDialog = useAppearancePreviewStore(s => s.closeResetDialog);
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const [resetDraft, { loading: resetLoading }] = useMutation(resetAppearanceDraftMutationDocument);

  const onResetConfirm = async () => {
    closeResetDialog();
    try {
      await resetDraft();
      markSaved();
      notify(labels.resetSuccess, "success");
    } catch (error) {
      logger.error("Failed to reset appearance draft from settings tab", { error });
      notify(labels.resetError, "error");
    }
  };

  return { onResetConfirm, resetLoading };
}
