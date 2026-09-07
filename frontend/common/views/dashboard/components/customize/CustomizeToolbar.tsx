"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  DownloadOutlined,
  ExitToAppOutlined,
  PaletteOutlined,
  PublishOutlined,
  RedoOutlined,
  RestartAltOutlined,
  SaveOutlined,
  UndoOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { DialogPresets } from "@/frontend/common/components/ui/dialog";
import type { AppearanceDraftInput, AppearanceSettingsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  appearanceSettingsQueryDocument,
  publishAppearanceMutationDocument,
  resetAppearanceDraftMutationDocument,
  saveAppearanceDraftMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { useAppearanceLogoUpload } from "@/frontend/common/hooks/useAppearanceLogoUpload";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";
import { AppearanceResetDialog } from "@/frontend/common/views/dashboard/appearance/shared/AppearanceResetDialog";
import { exportAppearanceJson } from "@/frontend/common/views/dashboard/appearance/shared/exportAppearanceJson";
import { prepareDraftForAction } from "@/frontend/common/views/dashboard/appearance/shared/resolveDraftLogoForSave";
import { useCustomizeOverlayAnnounce } from "@/frontend/common/views/dashboard/components/customize/customizeOverlayContext";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Stable GraphQL error code emitted by the backend `AppearanceConflictError`
 * (AC-33). Matched on Apollo `GraphQLError.extensions.code` to surface the
 * Reload/Overwrite dialog instead of a generic error toast.
 */
const APPEARANCE_CONFLICT_ERROR_CODE = "APPEARANCE_CONFLICT";

/**
 * Returns `true` if the given Apollo error contains at least one
 * `APPEARANCE_CONFLICT` GraphQL error (AC-33). The backend resolver wraps
 * `AppearanceConflictError` into a `GraphQLError` with this code via
 * `runAppearanceMutation` in `site-appearance-settings.pothos.ts`.
 */
function isAppearanceConflictError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const graphQLErrors = (err as { graphQLErrors?: Array<{ extensions?: { code?: string } }> }).graphQLErrors;
  if (!Array.isArray(graphQLErrors)) return false;
  return graphQLErrors.some(e => e?.extensions?.code === APPEARANCE_CONFLICT_ERROR_CODE);
}

/**
 * Shape of the `draftFields` fragment returned by the `appearanceSettings`
 * query (all fields nullable per the codegen `avoidOptionals: true` config).
 * Same structural shape as {@link AppearanceDraftInput} but with nullable
 * scalars — the runtime check below narrows it back to the non-nullable
 * store input type without an unsafe `as` cast.
 */
type AppearanceDraftFragment = NonNullable<
  NonNullable<NonNullable<AppearanceSettingsQuery>["appearanceSettings"]>["draftFields"]
>;

/**
 * Coerces the nullable `draftFields` fragment returned by the
 * `appearanceSettings` query into a non-nullable {@link AppearanceDraftInput}
 * suitable for `loadFromServer`. Returns `null` when any required field is
 * missing (AC-33 — used by the conflict Reload path to reseed the store from
 * the server response without an unsafe `as` cast).
 *
 * The published `appearance_settings` row should always satisfy this invariant
 * (the repo writes non-null values on `publishDraft`), but the codegen output
 * types are conservatively nullable, so we check at runtime before handing the
 * value to `loadFromServer`.
 */
function toAppearanceDraftInput(value: AppearanceDraftFragment | null | undefined): AppearanceDraftInput | null {
  if (!value) return null;
  const { colors } = value;
  const light = colors?.light;
  const dark = colors?.dark;
  if (!light || !dark) return null;
  if (!light.primaryMain || !light.secondaryMain) return null;
  if (!dark.primaryMain || !dark.secondaryMain) return null;
  if (!value.siteName || !value.siteTitle || !value.siteDescription || !value.defaultColorScheme) return null;
  return {
    colors: {
      light: { primaryMain: light.primaryMain, secondaryMain: light.secondaryMain },
      dark: { primaryMain: dark.primaryMain, secondaryMain: dark.secondaryMain },
    },
    logoUrl: value.logoUrl ?? null,
    siteName: value.siteName,
    siteTitle: value.siteTitle,
    siteDescription: value.siteDescription,
    defaultColorScheme: value.defaultColorScheme,
  };
}

/**
 * CustomizeToolbar - fixed 48px bar above the dashboard when `?customize=1`.
 *
 * Renders the action surface for the site-appearance customizer overlay
 * (Task 6.2, per `.ai/plans/brand/prototype/customize-overlay.html` S1):
 *
 *  - Amber "Customize" badge (left edge - same `warning` palette token as
 *    the header `CustomizeButton` and the appearance-tab draft chip).
 *  - Undo / Redo icon buttons wired to `appearancePreviewStore.undo()` /
 *    `redo()`, disabled when the corresponding stack is empty.
 *  - Save Draft button -> `saveAppearanceDraft` mutation with the store's
 *    `draft` as the input (no mapping - `AppearanceDraftInput` is the
 *    codegen mutation input type per stores/AGENTS.md "NO MAPPING").
 *  - Publish button -> `publishAppearance` mutation (copies draft -> published).
 *  - Reset button -> `resetAppearanceDraft` mutation, behind a confirm dialog.
 *  - Exit button -> strips `customize=1` from the URL via `router.replace`,
 *    preserving all other query params (e.g. `?tab=appearance`).
 *
 * Optimistic concurrency (AC-33, Task 9.7):
 *   Save Draft and Publish pass the server's last-known `updatedAt` as
 *   `expectedUpdatedAt`. When the server reports an `APPEARANCE_CONFLICT`
 *   error (another admin saved/published in the meantime), the toolbar
 *   surfaces a dialog with three options:
 *     - **Reload** - refetches the `appearanceSettings` query and reseeds the
 *       local store via `loadFromServer`, discarding local edits.
 *     - **Overwrite** - retries the original mutation with
 *       `expectedUpdatedAt: undefined`, bypassing the conflict check.
 *     - **Cancel** - dismisses the dialog; local edits are preserved.
 *
 * Task 6.1 owns the fixed positioning, amber bottom border, and mounting
 * logic; this component owns only the controls inside the bar.
 */
export function CustomizeToolbar() {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notifications = useNotifications();
  const announce = useCustomizeOverlayAnnounce();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  // Retry function captured at conflict time - "Overwrite" re-invokes it with
  // `expectedUpdatedAt: undefined` to bypass the optimistic-concurrency check.
  // Stored as state so the dialog buttons can fire it without prop-drilling.
  const [conflictRetry, setConflictRetry] = useState<null | (() => Promise<void>)>(null);

  // Reactive slices of the appearance preview store. Selecting the array
  // lengths (rather than `canUndo()` / `canRedo()` methods) gives us
  // referentially-stable primitives that re-render on history changes.
  const draft = useAppearancePreviewStore(s => s.draft);
  const dirty = useAppearancePreviewStore(s => s.dirty);
  const pastLength = useAppearancePreviewStore(s => s.past.length);
  const futureLength = useAppearancePreviewStore(s => s.future.length);
  const undo = useAppearancePreviewStore(s => s.undo);
  const redo = useAppearancePreviewStore(s => s.redo);
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const markPublished = useAppearancePreviewStore(s => s.markPublished);
  const loadFromServer = useAppearancePreviewStore(s => s.loadFromServer);
  const resetToDefaults = useAppearancePreviewStore(s => s.resetToDefaults);
  const setField = useAppearancePreviewStore(s => s.setField);
  const { uploadLogo } = useAppearanceLogoUpload();

  const canUndo = pastLength > 0;
  const canRedo = futureLength > 0;

  // AC-33 - track the server's last-known `updatedAt` so we can pass it as
  // `expectedUpdatedAt` on save/publish mutations. The query result drives
  // the initial value; successful mutations return the new row, which Apollo
  // cache-normalizes back into the query result (so `serverUpdatedAt` updates
  // automatically without an extra refetch).
  const { data: appearanceData, refetch: refetchAppearance } = useQuery(appearanceSettingsQueryDocument, {
    variables: { draft: true },
  });
  const serverUpdatedAt = appearanceData?.appearanceSettings?.updatedAt ?? null;

  const [saveDraft, { loading: saveLoading }] = useMutation(saveAppearanceDraftMutationDocument);
  const [publish, { loading: publishLoading }] = useMutation(publishAppearanceMutationDocument);
  const [resetDraft, { loading: resetLoading }] = useMutation(resetAppearanceDraftMutationDocument);

  const handleExit = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("customize");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

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
        setConflictRetry(() => async () => {
          await saveDraft({ variables: { input: draft, expectedUpdatedAt: undefined } });
          markSaved();
          notifications.show(t.saveDraftSuccess, { severity: "success" });
          announce(t.saveDraftSuccess);
        });
        setConflictOpen(true);
        return;
      }
      logger.error("Failed to save appearance draft", { error });
      notifications.show(t.saveDraftError, { severity: "error" });
    }
  };

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
        setConflictRetry(() => async () => {
          await publish({ variables: { expectedUpdatedAt: undefined } });
          markSaved();
          markPublished(draft);
          router.refresh();
          notifications.show(t.publishSuccess, { severity: "success" });
          announce(t.publishSuccess);
        });
        setConflictOpen(true);
        return;
      }
      logger.error("Failed to publish appearance", { error });
      notifications.show(t.publishError, { severity: "error" });
    }
  };

  const handleResetConfirm = async () => {
    setResetDialogOpen(false);
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

  return (
    <Box
      component="header"
      aria-label={t.toolbarBadge}
      sx={theme => ({
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        flexShrink: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        backgroundColor: "var(--mui-palette-background-paper)",
        color: "var(--mui-palette-onSurface)",
        borderBottom: `2px solid ${theme.palette.warning.main}`,
      })}
    >
      <Chip
        size="small"
        color="warning"
        icon={<PaletteOutlined fontSize="small" />}
        label={t.toolbarBadge}
        sx={theme => ({ fontWeight: 700, color: theme.palette.onWarning })}
      />

      <Divider orientation="vertical" flexItem variant="middle" />

      <Tooltip title={t.toolbarUndo}>
        <span>
          <IconButton size="small" onClick={undo} disabled={!canUndo} aria-label={t.toolbarUndo}>
            <UndoOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t.toolbarRedo}>
        <span>
          <IconButton size="small" onClick={redo} disabled={!canRedo} aria-label={t.toolbarRedo}>
            <RedoOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem variant="middle" />

      <Button
        size="small"
        variant="outlined"
        color="primary"
        startIcon={<SaveOutlined />}
        onClick={handleSaveDraft}
        disabled={!dirty || saveLoading}
      >
        {t.saveDraft}
      </Button>
      <Button
        size="small"
        variant="contained"
        color="warning"
        startIcon={<PublishOutlined />}
        onClick={handlePublish}
        disabled={publishLoading}
        sx={theme => ({ color: theme.palette.onWarning })}
      >
        {t.toolbarPublish}
      </Button>

      <Divider orientation="vertical" flexItem variant="middle" />

      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<RestartAltOutlined />}
        onClick={() => setResetDialogOpen(true)}
        disabled={resetLoading}
      >
        {t.resetToDefaults}
      </Button>

      {/* Task 9.3 (AC-28) — export the in-memory draft as appearance-settings.json.
          Uses `t.customize.exportJson` (short label from Task 9 i18n namespace)
          rather than the tab-level `t.exportJson` because the toolbar prefers
          compact labels. The handler is a one-liner — no toast: the browser's
          download UI is the confirmation. */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<DownloadOutlined />}
        onClick={() => exportAppearanceJson(draft)}
      >
        {t.customize.exportJson}
      </Button>

      <Box sx={{ flexGrow: 1 }} />

      <Typography
        variant="caption"
        sx={theme => ({
          color: theme.palette.text.disabled,
          display: { xs: "none", sm: "block" },
        })}
      >
        {t.toolbarLivePreviewHint}
      </Typography>

      <Divider orientation="vertical" flexItem variant="middle" />

      <Button size="small" variant="outlined" color="error" startIcon={<ExitToAppOutlined />} onClick={handleExit}>
        {t.toolbarExit}
      </Button>

      <AppearanceResetDialog
        open={resetDialogOpen}
        loading={resetLoading}
        labels={t}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
      />

      <Dialog {...DialogPresets.confirm} open={conflictOpen} onClose={handleConflictCancel}>
        <DialogTitle>{t.conflictTitle}</DialogTitle>
        <DialogContent>{t.conflictBody}</DialogContent>
        <DialogActions>
          <Button onClick={handleConflictCancel}>{t.conflictCancel}</Button>
          <Button onClick={handleConflictReload} color="primary" variant="outlined">
            {t.conflictReload}
          </Button>
          <Button onClick={handleConflictOverwrite} color="warning" variant="contained">
            {t.conflictOverwrite}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
