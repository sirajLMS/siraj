"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import {
  publishAppearanceMutationDocument,
  resetAppearanceDraftMutationDocument,
  saveAppearanceDraftMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { useAppearanceLogoUpload } from "@/frontend/common/hooks/useAppearanceLogoUpload";
import { APPEARANCE_PRESETS, type AppearancePreset } from "@/frontend/common/providers/theme/presets";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";
import { exportAppearanceJson } from "@/frontend/common/views/dashboard/appearance/shared/exportAppearanceJson";
import { prepareDraftForAction } from "@/frontend/common/views/dashboard/appearance/shared/resolveDraftLogoForSave";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * ViewModel for the Settings → Appearance tab (form view of the site
 * appearance customizer).
 *
 * Owns every mutation (`saveAppearanceDraft` / `publishAppearance` /
 * `resetAppearanceDraft`), toast notifications, the customize-mode router
 * navigation, and the full `Dashboard.Settings.appearance` label bundle, so
 * the desktop/mobile tier views stay purely presentational.
 *
 * Because this form view does not track the server `updatedAt` snapshot (it
 * has no live query), mutations are sent with `expectedUpdatedAt: undefined`
 * — i.e. the optimistic-concurrency check is bypassed here; the conflict
 * Reload/Overwrite dialog is owned by the customize overlay.
 */
export function useAppearanceSettingsViewModel(): AppearanceSettingsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const router = useRouter();
  const notifications = useNotifications();
  const draft = useAppearancePreviewStore(s => s.draft);
  const dirty = useAppearancePreviewStore(s => s.dirty);
  const presetId = useAppearancePreviewStore(s => s.presetId);
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const applyPreset = useAppearancePreviewStore(s => s.applyPreset);
  const setField = useAppearancePreviewStore(s => s.setField);
  const resetDialogOpen = useAppearancePreviewStore(s => s.resetDialogOpen);
  const openResetDialog = useAppearancePreviewStore(s => s.openResetDialog);
  const closeResetDialog = useAppearancePreviewStore(s => s.closeResetDialog);
  const { uploadLogo } = useAppearanceLogoUpload();
  const [saveDraft, { loading: saveDraftLoading }] = useMutation(saveAppearanceDraftMutationDocument);
  const [publish, { loading: publishLoading }] = useMutation(publishAppearanceMutationDocument);
  const [resetDraft, { loading: resetLoading }] = useMutation(resetAppearanceDraftMutationDocument);

  const onEnterCustomizeMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("customize", "1");
    router.push(url.pathname + url.search);
  };

  const onApplyPreset = (preset: AppearancePreset): void => {
    applyPreset(preset);
    notifications.show(labels.presetApplied(preset.name), { severity: "success" });
  };

  const onSaveDraft = async () => {
    try {
      const input = await prepareDraftForAction(draft, uploadLogo, setField);
      await saveDraft({ variables: { input, expectedUpdatedAt: undefined } });
      markSaved();
      notifications.show(labels.saveDraftSuccess, { severity: "success" });
    } catch (error) {
      logger.error("Failed to save appearance draft from settings tab", { error });
      notifications.show(labels.saveDraftError, { severity: "error" });
    }
  };

  const onPublish = async () => {
    try {
      const input = await prepareDraftForAction(draft, uploadLogo, setField);
      // Persist in-memory edits into the server draft first so the publish
      // reflects what the admin actually sees on screen.
      if (dirty) {
        await saveDraft({ variables: { input, expectedUpdatedAt: undefined } });
      }
      await publish({ variables: { expectedUpdatedAt: undefined } });
      markSaved();
      notifications.show(labels.publishSuccess, { severity: "success" });
    } catch (error) {
      logger.error("Failed to publish appearance from settings tab", { error });
      notifications.show(labels.publishError, { severity: "error" });
    }
  };

  const onExportJson = () => {
    // Serializes the in-memory draft as JSON with a `$schema` header pointing
    // to `shared/schemas/appearance.schema.json` and triggers a browser
    // download of `appearance-settings.json` (IDE-autocompletion-ready).
    exportAppearanceJson(draft);
    notifications.show(labels.exportJson, { severity: "success" });
  };

  const onResetConfirm = async () => {
    closeResetDialog();
    try {
      await resetDraft();
      // The server's draft now matches the published row, so the local
      // `dirty` flag clears; the customizer re-syncs from the refetched
      // `appearanceSettings` query when it next mounts.
      markSaved();
      notifications.show(labels.resetSuccess, { severity: "success" });
    } catch (error) {
      logger.error("Failed to reset appearance draft from settings tab", { error });
      notifications.show(labels.resetError, { severity: "error" });
    }
  };

  return {
    labels,
    draft,
    dirty,
    presetId,
    presets: APPEARANCE_PRESETS,
    // Static metadata placeholders — this form view has no live query, so the
    // published/draft rows render generic hints instead of real timestamps.
    publishedMetaLabel: labels.lastPublishedBy("administrator", "2 days ago"),
    draftMetaLabel: labels.draftUpdatedJustNow,
    saveDraftLoading,
    publishLoading,
    resetLoading,
    resetDialogOpen,
    saveDraftDisabled: !dirty || saveDraftLoading,
    onEnterCustomizeMode,
    onApplyPreset,
    onSaveDraft,
    onPublish,
    onExportJson,
    onOpenResetDialog: openResetDialog,
    onCloseResetDialog: closeResetDialog,
    onResetConfirm,
  };
}
