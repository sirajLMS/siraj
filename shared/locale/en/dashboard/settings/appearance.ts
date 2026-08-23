import type { SettingsAppearanceTabLabels } from "@/shared/locale/types/dashboard/settings/appearance";

export const dashboardSettingsAppearanceEn: SettingsAppearanceTabLabels = {
  title: "Site Appearance",
  subtitle: "Customize your site's branding, colors, and visual identity.",

  publishedBadge: "Published",
  draftBadge: "Draft has changes",
  noPublishedVersion: "No published version yet",
  lastPublishedBy: (actor, when) => `Last published ${when} by ${actor}`,
  draftUpdated: when => `Draft updated ${when}`,
  draftUpdatedJustNow: "Draft updated just now",

  enterCustomizeMode: "Enter Customize Mode",
  enterCustomizeModeHint: "Open the live customizer to edit colors, logo, and brand identity in real time.",

  saveDraft: "Save Draft",
  publishNow: "Publish Now",
  resetToDefaults: "Reset to Defaults",
  exportJson: "Export JSON",

  toolbarBadge: "Customize",
  toolbarExit: "Exit",
  toolbarUndo: "Undo",
  toolbarRedo: "Redo",
  toolbarLivePreviewHint: "Changes preview live as you edit",
  toolbarPublish: "Publish",

  saveDraftSuccess: "Appearance draft saved.",
  saveDraftError: "Failed to save appearance draft.",
  publishSuccess: "Appearance published to all users.",
  publishError: "Failed to publish appearance settings.",
  resetSuccess: "Appearance draft reset to defaults.",
  resetError: "Failed to reset appearance draft.",

  resetConfirmTitle: "Reset Appearance Draft",
  resetConfirmBody: "Reset the draft to default appearance? This will not change the published version.",
  resetConfirmCancel: "Cancel",
  resetConfirmConfirm: "Reset",

  conflictTitle: "Appearance Modified by Another Admin",
  conflictBody:
    "The appearance settings were changed by another admin since you last loaded them. " +
    "Reload to discard your changes and use the latest version, or Overwrite to push your changes through.",
  conflictReload: "Reload",
  conflictOverwrite: "Overwrite",
  conflictCancel: "Cancel",

  errorBoundaryTitle: "Customizer Error",
  errorBoundaryBody: "The site-appearance customizer hit an unexpected error. Reset the draft and exit to recover.",
  errorBoundaryReset: "Reset & Exit",

  noPermission: "You don't have permission to manage site appearance.",

  customize: {
    enterMode: "Enter Customize Mode",
    exitMode: "Exit Customize Mode",
    undo: "Undo",
    redo: "Redo",
    saveDraft: "Save Draft",
    publish: "Publish",
    resetDefaults: "Reset to Defaults",
    brandIdentity: "Brand Identity",
    colors: "Theme Colors",
    light: "Light",
    dark: "Dark",
    logoUpload: "Logo",
    defaultMode: "Default Mode",
    published: "Published",
    draft: "Draft",
    exportJson: "Export JSON",
  },
};
