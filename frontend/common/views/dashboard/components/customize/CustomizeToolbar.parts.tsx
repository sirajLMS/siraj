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
import { Box, Button, Chip, Divider, type SvgIconProps, Typography } from "@mui/material";
import { TooltipIconButton } from "@/frontend/common/components/ui/button/TooltipIconButton";
import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { exportAppearanceJson } from "@/frontend/common/views/dashboard/appearance/shared/exportAppearanceJson";
import type { SettingsAppearanceTabLabels } from "@/shared/locale/types/dashboard/settings/appearance";

interface HistoryIconButtonProps {
  readonly title: string;
  readonly icon: (props: SvgIconProps) => React.ReactNode;
  readonly onClick: () => void;
  readonly disabled: boolean;
}

function HistoryIconButton({ title, icon: Icon, onClick, disabled }: HistoryIconButtonProps) {
  return (
    <TooltipIconButton
      label={title}
      icon={<Icon fontSize="small" />}
      onClick={onClick}
      disabled={disabled}
      size="small"
    />
  );
}

export interface CustomizeToolbarControlsProps {
  readonly labels: SettingsAppearanceTabLabels;
  readonly draft: AppearanceDraftInput;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly dirty: boolean;
  readonly saveLoading: boolean;
  readonly publishLoading: boolean;
  readonly resetLoading: boolean;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly onSaveDraft: () => void;
  readonly onPublish: () => void;
  readonly onOpenResetDialog: () => void;
  readonly onExit: () => void;
}

export function CustomizeToolbarControls({
  labels: t,
  draft,
  canUndo,
  canRedo,
  dirty,
  saveLoading,
  publishLoading,
  resetLoading,
  undo,
  redo,
  onSaveDraft,
  onPublish,
  onOpenResetDialog,
  onExit,
}: CustomizeToolbarControlsProps) {
  return (
    <>
      <Chip
        size="small"
        color="warning"
        icon={<PaletteOutlined fontSize="small" />}
        label={t.toolbarBadge}
        sx={theme => ({ fontWeight: 700, color: theme.palette.onWarning })}
      />

      <Divider orientation="vertical" flexItem variant="middle" />

      <HistoryIconButton title={t.toolbarUndo} icon={UndoOutlined} onClick={undo} disabled={!canUndo} />
      <HistoryIconButton title={t.toolbarRedo} icon={RedoOutlined} onClick={redo} disabled={!canRedo} />

      <Divider orientation="vertical" flexItem variant="middle" />

      <Button
        size="small"
        variant="outlined"
        color="primary"
        startIcon={<SaveOutlined />}
        onClick={onSaveDraft}
        disabled={!dirty || saveLoading}
      >
        {t.saveDraft}
      </Button>
      <Button
        size="small"
        variant="contained"
        color="warning"
        startIcon={<PublishOutlined />}
        onClick={onPublish}
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
        onClick={onOpenResetDialog}
        disabled={resetLoading}
      >
        {t.resetToDefaults}
      </Button>

      {/* Export the in-memory draft as appearance-settings.json. Uses
          `t.customize.exportJson` (short label from the customize
          sub-namespace) rather than the tab-level `t.exportJson` because the
          toolbar prefers compact labels. The handler is a one-liner — no
          toast: the browser's download UI is the confirmation. */}
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

      <Button size="small" variant="outlined" color="error" startIcon={<ExitToAppOutlined />} onClick={onExit}>
        {t.toolbarExit}
      </Button>
    </>
  );
}
