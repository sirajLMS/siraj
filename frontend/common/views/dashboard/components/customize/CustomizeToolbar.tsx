"use client";

import { Box } from "@mui/material";
import { useState } from "react";
import { AppearanceResetDialog } from "@/frontend/common/views/dashboard/appearance/shared/AppearanceResetDialog";
import {
  useAppearancePublishAction,
  useAppearanceResetAction,
  useAppearanceSaveAction,
} from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar.actions.hooks";
import { CustomizeConflictDialog } from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar.conflict.parts";
import {
  useAppearanceConflictDialog,
  useAppearanceDraftSource,
  useCustomizeExitAction,
} from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar.hooks";
import { CustomizeToolbarControls } from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar.parts";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * CustomizeToolbar - fixed 48px bar above the dashboard when `?customize=1`.
 *
 * Renders the action surface for the site-appearance customizer overlay:
 * amber "Customize" badge, undo/redo, Save Draft, Publish, Reset to
 * Defaults (behind a confirm dialog), JSON export, and Exit. Mutations,
 * conflict handling (AC-33), and draft-store wiring live in
 * `CustomizeToolbar.hooks` / `CustomizeToolbar.actions.hooks`; this
 * component owns only the fixed positioning and the controls layout.
 */
export function CustomizeToolbar() {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const { draft, dirty, pastLength, futureLength, undo, redo, serverUpdatedAt, refetchAppearance } =
    useAppearanceDraftSource();
  const { handleExit } = useCustomizeExitAction();
  const { conflictOpen, openConflict, handleConflictReload, handleConflictOverwrite, handleConflictCancel } =
    useAppearanceConflictDialog(refetchAppearance);
  const { handleSaveDraft, saveLoading } = useAppearanceSaveAction({ draft, serverUpdatedAt, openConflict });
  const { handlePublish, publishLoading } = useAppearancePublishAction({
    draft,
    dirty,
    serverUpdatedAt,
    openConflict,
  });
  const { handleResetConfirm, resetLoading } = useAppearanceResetAction();

  const handleResetClick = () => {
    setResetDialogOpen(false);
    void handleResetConfirm();
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
      <CustomizeToolbarControls
        labels={t}
        draft={draft}
        canUndo={pastLength > 0}
        canRedo={futureLength > 0}
        dirty={dirty}
        saveLoading={saveLoading}
        publishLoading={publishLoading}
        resetLoading={resetLoading}
        undo={undo}
        redo={redo}
        onSaveDraft={() => void handleSaveDraft()}
        onPublish={() => void handlePublish()}
        onOpenResetDialog={() => setResetDialogOpen(true)}
        onExit={handleExit}
      />

      <AppearanceResetDialog
        open={resetDialogOpen}
        loading={resetLoading}
        labels={t}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetClick}
      />

      <CustomizeConflictDialog
        open={conflictOpen}
        labels={t}
        onCancel={handleConflictCancel}
        onReload={() => void handleConflictReload()}
        onOverwrite={() => void handleConflictOverwrite()}
      />
    </Box>
  );
}
