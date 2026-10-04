"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AppearanceDraftInput, AppearanceSettingsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { appearanceSettingsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";
import { toAppearanceDraftInput } from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar.helpers";
import { useCustomizeOverlayAnnounce } from "@/frontend/common/views/dashboard/components/customize/customizeOverlayContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface AppearanceDraftSource {
  readonly draft: AppearanceDraftInput;
  readonly dirty: boolean;
  readonly pastLength: number;
  readonly futureLength: number;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly serverUpdatedAt: string | null;
  readonly refetchAppearance: () => Promise<{ data?: AppearanceSettingsQuery | null }>;
}

/**
 * Reactive slices of the appearance preview store plus the
 * `appearanceSettings` query. Selecting the history array lengths (rather
 * than `canUndo()` / `canRedo()`) gives referentially-stable primitives that
 * re-render on history changes. Also seeds the draft store from the server's
 * draft fields once per customize session, so the sidebar and a subsequent
 * publish act on the real server state instead of the in-memory factory
 * defaults. Seeding is skipped while the user has unsaved local edits
 * (their in-flight draft wins).
 */
export function useAppearanceDraftSource(): AppearanceDraftSource {
  const draft = useAppearancePreviewStore(s => s.draft);
  const dirty = useAppearancePreviewStore(s => s.dirty);
  const hydrated = useAppearancePreviewStore(s => s.hydrated);
  const pastLength = useAppearancePreviewStore(s => s.past.length);
  const futureLength = useAppearancePreviewStore(s => s.future.length);
  const undo = useAppearancePreviewStore(s => s.undo);
  const redo = useAppearancePreviewStore(s => s.redo);
  const loadFromServer = useAppearancePreviewStore(s => s.loadFromServer);

  // AC-33 - track the server's last-known `updatedAt` so we can pass it as
  // `expectedUpdatedAt` on save/publish mutations. The query result drives
  // the initial value; successful mutations return the new row, which Apollo
  // cache-normalizes back into the query result (so `serverUpdatedAt` updates
  // automatically without an extra refetch).
  const { data: appearanceData, refetch: refetchAppearance } = useQuery(appearanceSettingsQueryDocument, {
    variables: { draft: true },
  });
  const serverUpdatedAt = appearanceData?.appearanceSettings?.updatedAt ?? null;

  useEffect(() => {
    if (hydrated || dirty) return;
    const serverDraft = toAppearanceDraftInput(appearanceData?.appearanceSettings?.draftFields);
    if (serverDraft) loadFromServer(serverDraft);
  }, [appearanceData, hydrated, dirty, loadFromServer]);

  return { draft, dirty, pastLength, futureLength, undo, redo, serverUpdatedAt, refetchAppearance };
}

/** Strips `customize=1` from the URL, preserving all other query params. */
export function useCustomizeExitAction(): { readonly handleExit: () => void } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleExit = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("customize");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return { handleExit };
}

export interface AppearanceConflictDialog {
  readonly conflictOpen: boolean;
  readonly openConflict: (retry: () => Promise<void>) => void;
  readonly handleConflictReload: () => Promise<void>;
  readonly handleConflictOverwrite: () => Promise<void>;
  readonly handleConflictCancel: () => void;
}

/**
 * Optimistic-concurrency conflict dialog state (AC-33). `openConflict`
 * captures the retry function that re-invokes the failed mutation with
 * `expectedUpdatedAt: undefined`; the dialog's "Overwrite" button fires it,
 * "Reload" re-syncs the store from the server, and "Cancel" keeps local
 * edits.
 */
export function useAppearanceConflictDialog(
  refetchAppearance: () => Promise<{ data?: AppearanceSettingsQuery | null }>
): AppearanceConflictDialog {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const notifications = useNotifications();
  const announce = useCustomizeOverlayAnnounce();
  const loadFromServer = useAppearancePreviewStore(s => s.loadFromServer);
  const [conflictOpen, setConflictOpen] = useState(false);
  // Retry function captured at conflict time - "Overwrite" re-invokes it with
  // `expectedUpdatedAt: undefined` to bypass the optimistic-concurrency check.
  // Stored as state so the dialog buttons can fire it without prop-drilling.
  const [conflictRetry, setConflictRetry] = useState<null | (() => Promise<void>)>(null);

  const openConflict = useCallback((retry: () => Promise<void>) => {
    setConflictRetry(() => retry);
    setConflictOpen(true);
  }, []);

  /**
   * Re-syncs the local store from the server after a "Reload" conflict
   * resolution. Refetches the `appearanceSettings` query and calls
   * `loadFromServer` with the fresh draft fields (clearing history + dirty).
   * Falls back to a toast if the refetch returns no row (should not happen
   * post-conflict since the conflict itself implies a row exists).
   */
  const handleConflictReload = useCallback(async () => {
    setConflictOpen(false);
    setConflictRetry(null);
    try {
      const { data } = await refetchAppearance();
      const row = data?.appearanceSettings;
      const draftFields = toAppearanceDraftInput(row?.draftFields);
      if (draftFields) {
        loadFromServer(draftFields);
      }
      notifications.show(t.conflictTitle, { severity: "info" });
      announce(t.conflictTitle);
    } catch (error) {
      logger.error("Failed to refetch appearance after conflict reload", { error });
      notifications.show(t.saveDraftError, { severity: "error" });
    }
  }, [refetchAppearance, loadFromServer, notifications, announce, t.conflictTitle, t.saveDraftError]);

  /**
   * Re-invokes the captured `conflictRetry` function, which retries the
   * original mutation with `expectedUpdatedAt: undefined` to bypass the
   * optimistic-concurrency check (AC-33 "Overwrite" path).
   */
  const handleConflictOverwrite = useCallback(async () => {
    const retry = conflictRetry;
    setConflictOpen(false);
    setConflictRetry(null);
    if (!retry) return;
    try {
      await retry();
    } catch (error) {
      logger.error("Failed to overwrite appearance after conflict", { error });
      notifications.show(t.saveDraftError, { severity: "error" });
    }
  }, [conflictRetry, notifications, t.saveDraftError]);

  const handleConflictCancel = useCallback(() => {
    setConflictOpen(false);
    setConflictRetry(null);
  }, []);

  return { conflictOpen, openConflict, handleConflictReload, handleConflictOverwrite, handleConflictCancel };
}
