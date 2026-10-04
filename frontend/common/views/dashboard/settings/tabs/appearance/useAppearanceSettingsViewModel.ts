"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { APPEARANCE_PRESETS, type AppearancePreset } from "@/frontend/common/providers/theme/presets";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { exportAppearanceJson } from "@/frontend/common/views/dashboard/appearance/shared/exportAppearanceJson";
import {
  useAppearanceDraftPersistence,
  usePublishAppearanceAction,
  useResetAppearanceDraftAction,
  useSaveAppearanceDraftAction,
} from "@/frontend/common/views/dashboard/settings/tabs/appearance/useAppearanceSettingsViewModel.hooks";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * ViewModel for the Settings → Appearance tab (form view of the site
 * appearance customizer).
 *
 * Wires the full `Dashboard.Settings.appearance` label bundle, the
 * preview-store state, and the mutation action hooks (draft persistence, save
 * draft, publish, reset) into the flat handler surface consumed by the
 * desktop/mobile tier views, which stay purely presentational.
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
  const presetId = useAppearancePreviewStore(s => s.presetId);
  const resetDialogOpen = useAppearancePreviewStore(s => s.resetDialogOpen);
  const openResetDialog = useAppearancePreviewStore(s => s.openResetDialog);
  const closeResetDialog = useAppearancePreviewStore(s => s.closeResetDialog);
  const applyPreset = useAppearancePreviewStore(s => s.applyPreset);
  const notify = (message: string, severity: "success" | "error") => notifications.show(message, { severity });

  const persistence = useAppearanceDraftPersistence();
  const { onSaveDraft } = useSaveAppearanceDraftAction({ labels, notify, persistence });
  const { onPublish, publishLoading } = usePublishAppearanceAction({ labels, notify, persistence });
  const { onResetConfirm, resetLoading } = useResetAppearanceDraftAction({ labels, notify });

  const onEnterCustomizeMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("customize", "1");
    router.push(url.pathname + url.search);
  };

  const onApplyPreset = (preset: AppearancePreset): void => {
    applyPreset(preset);
    notify(labels.presetApplied(preset.name), "success");
  };

  // Serializes the in-memory draft as JSON with a `$schema` header pointing
  // to `shared/schemas/appearance.schema.json` and triggers a browser
  // download of `appearance-settings.json` (IDE-autocompletion-ready).
  const onExportJson = () => {
    exportAppearanceJson(draft);
    notify(labels.exportJson, "success");
  };

  return {
    labels,
    draft,
    dirty: persistence.dirty,
    presetId,
    presets: APPEARANCE_PRESETS,
    // Static metadata placeholders — this form view has no live query, so the
    // published/draft rows render generic hints instead of real timestamps.
    publishedMetaLabel: labels.lastPublishedBy("administrator", "2 days ago"),
    draftMetaLabel: labels.draftUpdatedJustNow,
    saveDraftLoading: persistence.saveDraftLoading,
    publishLoading,
    resetLoading,
    resetDialogOpen,
    saveDraftDisabled: !persistence.dirty || persistence.saveDraftLoading,
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
