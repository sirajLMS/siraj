"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  publishAppearanceMutationDocument,
  resetAppearanceDraftMutationDocument,
  saveAppearanceDraftMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { useAppearanceLogoUpload } from "@/frontend/common/hooks/useAppearanceLogoUpload";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";
import { prepareDraftForAction } from "@/frontend/common/views/dashboard/appearance/shared/resolveDraftLogoForSave";
import {
  isAppearanceConflictError,
  toAppearanceDraftInput,
} from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar.helpers";
import { useCustomizeOverlayAnnounce } from "@/frontend/common/views/dashboard/components/customize/customizeOverlayContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface AppearanceSaveAction {
  readonly handleSaveDraft: () => Promise<void>;
  readonly saveLoading: boolean;
}

export function useAppearanceSaveAction(deps: {
  readonly draft: AppearanceDraftInput;
  readonly serverUpdatedAt: string | null;
  readonly openConflict: (retry: () => Promise<void>) => void;
}): AppearanceSaveAction {
  const { draft, serverUpdatedAt, openConflict } = deps;
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const notifications = useNotifications();
  const announce = useCustomizeOverlayAnnounce();
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const setField = useAppearancePreviewStore(s => s.setField);
  const { uploadLogo } = useAppearanceLogoUpload();
  const [saveDraft, { loading: saveLoading }] = useMutation(saveAppearanceDraftMutationDocument);

  const handleSaveDraft = async () => {
    try {
      const input = await prepareDraftForAction(draft, uploadLogo, setField);
      await saveDraft({ variables: { input, expectedUpdatedAt: serverUpdatedAt } });
      markSaved();
      notifications.show(t.saveDraftSuccess, { severity: "success" });
      announce(t.saveDraftSuccess);
    } catch (error) {
      if (isAppearanceConflictError(error)) {
        // Capture a retry that bypasses the optimistic-concurrency check
        // (expectedUpdatedAt: undefined) so the Overwrite button can re-fire.
        openConflict(async () => {
          await saveDraft({ variables: { input: draft, expectedUpdatedAt: undefined } });
          markSaved();
          notifications.show(t.saveDraftSuccess, { severity: "success" });
          announce(t.saveDraftSuccess);
        });
        return;
      }
      logger.error("Failed to save appearance draft", { error });
      notifications.show(t.saveDraftError, { severity: "error" });
    }
  };

  return { handleSaveDraft, saveLoading };
}

export interface AppearancePublishAction {
  readonly handlePublish: () => Promise<void>;
  readonly publishLoading: boolean;
}

export function useAppearancePublishAction(deps: {
  readonly draft: AppearanceDraftInput;
  readonly dirty: boolean;
  readonly serverUpdatedAt: string | null;
  readonly openConflict: (retry: () => Promise<void>) => void;
}): AppearancePublishAction {
  const { draft, dirty, serverUpdatedAt, openConflict } = deps;
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const notifications = useNotifications();
  const announce = useCustomizeOverlayAnnounce();
  const router = useRouter();
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const markPublished = useAppearancePreviewStore(s => s.markPublished);
  const setField = useAppearancePreviewStore(s => s.setField);
  const { uploadLogo } = useAppearanceLogoUpload();
  const [saveDraft] = useMutation(saveAppearanceDraftMutationDocument);
  const [publish, { loading: publishLoading }] = useMutation(publishAppearanceMutationDocument);

  const handlePublish = async () => {
    try {
      const input = await prepareDraftForAction(draft, uploadLogo, setField);
      // Save the in-memory edits into the server draft first so the
      // publish actually reflects what the admin sees on screen; without
      // this, clicking PUBLISH with unsaved changes would live-publish the
      // previous server state instead of the current preview.
      let latestUpdatedAt: string | undefined = serverUpdatedAt ?? undefined;
      if (dirty) {
        const saveResult = await saveDraft({ variables: { input, expectedUpdatedAt: serverUpdatedAt } });
        latestUpdatedAt = saveResult.data?.saveAppearanceDraft?.updatedAt ?? undefined;
      }
      await publish({ variables: { expectedUpdatedAt: latestUpdatedAt } });
      markSaved();
      // Record the published snapshot so exiting customize mode restores the
      // NEW published values (not the pre-publish DOM captures), and refresh
      // the route so server-rendered surfaces (theme stylesheet, metadata)
      // re-render against the freshly published row instead of waiting for a
      // full page reload.
      markPublished(input);
      router.refresh();
      notifications.show(t.publishSuccess, { severity: "success" });
      announce(t.publishSuccess);
    } catch (error) {
      if (isAppearanceConflictError(error)) {
        openConflict(async () => {
          await publish({ variables: { expectedUpdatedAt: undefined } });
          markSaved();
          markPublished(draft);
          router.refresh();
          notifications.show(t.publishSuccess, { severity: "success" });
          announce(t.publishSuccess);
        });
        return;
      }
      logger.error("Failed to publish appearance", { error });
      notifications.show(t.publishError, { severity: "error" });
    }
  };

  return { handlePublish, publishLoading };
}

export interface AppearanceResetAction {
  readonly handleResetConfirm: () => Promise<void>;
  readonly resetLoading: boolean;
}

export function useAppearanceResetAction(): AppearanceResetAction {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const notifications = useNotifications();
  const announce = useCustomizeOverlayAnnounce();
  const loadFromServer = useAppearancePreviewStore(s => s.loadFromServer);
  const resetToDefaults = useAppearancePreviewStore(s => s.resetToDefaults);
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const [resetDraft, { loading: resetLoading }] = useMutation(resetAppearanceDraftMutationDocument);

  const handleResetConfirm = async () => {
    try {
      const result = await resetDraft();
      const draftFields = result.data?.resetAppearanceDraft?.draftFields ?? null;
      const synced = toAppearanceDraftInput(draftFields);
      if (synced) {
        loadFromServer(synced);
      } else {
        resetToDefaults();
      }
      markSaved();
      notifications.show(t.resetSuccess, { severity: "success" });
      announce(t.resetSuccess);
    } catch (error) {
      logger.error("Failed to reset appearance draft", { error });
      notifications.show(t.resetError, { severity: "error" });
    }
  };

  return { handleResetConfirm, resetLoading };
}
