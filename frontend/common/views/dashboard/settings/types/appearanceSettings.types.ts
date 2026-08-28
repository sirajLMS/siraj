import type { ReactNode } from "react";
import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AppearancePreset, AppearancePresetId } from "@/frontend/common/providers/theme/presets";
import type { SettingsAppearanceTabLabels } from "@/shared/locale/types/dashboard/settings/appearance";

/**
 * Slot contract satisfied by both tier section panels
 * (`DesktopSectionPanel` / `MobileSectionPanel`) so the tab scaffold can stay
 * tier-agnostic with a single component slot.
 */
export interface AppearanceSectionPanelSlotProps {
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * View model for the Settings → Appearance tab.
 *
 * Exposes the in-memory appearance draft plus all actions (save draft,
 * publish, reset, export, preset application, customize-mode entry) as flat
 * handlers so tier views stay purely presentational.
 */
export interface AppearanceSettingsViewModel {
  readonly labels: SettingsAppearanceTabLabels;
  /** Read-only snapshot of the in-memory draft (per-mode brand colors). */
  readonly draft: AppearanceDraftInput;
  /** Whether the draft differs from the last saved server snapshot. */
  readonly dirty: boolean;
  /** Currently active preset id; `null` when the draft matches no preset. */
  readonly presetId: AppearancePresetId | null;
  /** Built-in preset catalog rendered by the tier views. */
  readonly presets: readonly AppearancePreset[];
  /** Published-row subtitle (static — this form view has no live query). */
  readonly publishedMetaLabel: string;
  /** Draft-row subtitle (static — this form view has no live query). */
  readonly draftMetaLabel: string;
  readonly saveDraftLoading: boolean;
  readonly publishLoading: boolean;
  readonly resetLoading: boolean;
  readonly resetDialogOpen: boolean;
  /** Save Draft button disabled state (no changes to save or save in flight). */
  readonly saveDraftDisabled: boolean;
  readonly onEnterCustomizeMode: () => void;
  readonly onApplyPreset: (preset: AppearancePreset) => void;
  readonly onSaveDraft: () => Promise<void>;
  readonly onPublish: () => Promise<void>;
  readonly onExportJson: () => void;
  readonly onOpenResetDialog: () => void;
  readonly onCloseResetDialog: () => void;
  readonly onResetConfirm: () => Promise<void>;
}
