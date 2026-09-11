/**
 * SettingsAppearanceTabLabels — i18n strings for the Settings → Appearance tab.
 *
 * The tab body (form view) renders a hero with published/draft status, an
 * "Enter Customize Mode" CTA, and an action bar (Save Draft / Publish Now /
 * Reset to Defaults / Export JSON). The `customize` sub-namespace carries
 * the customizer overlay strings (toolbar + sidebar) added in Task 9
 * (AC-24, implementation.md §14).
 */
export interface SettingsAppearanceTabLabels {
  // ─── Hero / page header ────────────────────────────────────────────
  readonly title: string;
  readonly subtitle: string;

  // ─── Status row ────────────────────────────────────────────────────
  readonly publishedBadge: string;
  readonly draftBadge: string;
  readonly noPublishedVersion: string;
  readonly lastPublishedBy: (actor: string, when: string) => string;
  readonly draftUpdated: (when: string) => string;
  readonly draftUpdatedJustNow: string;

  // ─── Customize Mode CTA ────────────────────────────────────────────
  readonly enterCustomizeMode: string;
  readonly enterCustomizeModeHint: string;

  // ─── Brand color preview (form view) ──────────────────────────────
  readonly currentBrandColors: string;
  readonly currentBrandColorsHint: string;
  readonly quickPresets: string;
  readonly quickPresetsHint: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly lightMode: string;
  readonly darkMode: string;

  // ─── Action bar ────────────────────────────────────────────────────
  readonly saveDraft: string;
  readonly publishNow: string;
  readonly resetToDefaults: string;
  readonly exportJson: string;

  // ─── Customize toolbar (Task 6.2 — overlay above dashboard) ────────
  /** Amber chip label at the start of the customize toolbar ("Customize"). */
  readonly toolbarBadge: string;
  /** Exit button — strips ?customize=1 from the URL. */
  readonly toolbarExit: string;
  /** Undo icon-button tooltip + aria-label. */
  readonly toolbarUndo: string;
  /** Redo icon-button tooltip + aria-label. */
  readonly toolbarRedo: string;
  /** Hint shown on the right of the toolbar ("Changes preview live..."). */
  readonly toolbarLivePreviewHint: string;
  /** Publish button label inside the customize toolbar (may differ from tab). */
  readonly toolbarPublish: string;

  // ─── Toast / status messages ───────────────────────────────────────
  /** Success toast after applying a quick preset to the in-memory draft. */
  readonly presetApplied: (presetName: string) => string;
  readonly saveDraftSuccess: string;
  readonly saveDraftError: string;
  readonly publishSuccess: string;
  readonly publishError: string;
  readonly resetSuccess: string;
  readonly resetError: string;

  // ─── Reset confirmation dialog ─────────────────────────────────────
  readonly resetConfirmTitle: string;
  readonly resetConfirmBody: string;
  readonly resetConfirmCancel: string;
  readonly resetConfirmConfirm: string;

  // ─── Conflict dialog (AC-33 — multi-admin optimistic concurrency) ─
  /** Title shown when the server reports an `APPEARANCE_CONFLICT` error. */
  readonly conflictTitle: string;
  /** Body copy explaining the Reload / Overwrite options. */
  readonly conflictBody: string;
  /** "Reload" button — discards local edits and re-syncs from the server. */
  readonly conflictReload: string;
  /** "Overwrite" button — retries the mutation, bypassing the updatedAt check. */
  readonly conflictOverwrite: string;
  /** Cancel button on the conflict dialog (dismisses without action). */
  readonly conflictCancel: string;

  // ─── Error boundary (Task 9.9 — AC-35) ──────────────────────────────
  /** Title shown when the customizer crashes (class error boundary fallback). */
  readonly errorBoundaryTitle: string;
  /** Body copy explaining the Reset & Exit recovery action. */
  readonly errorBoundaryBody: string;
  /** Reset button label on the error boundary fallback (clears store + closes overlay). */
  readonly errorBoundaryReset: string;

  // ─── Permission banner ─────────────────────────────────────────────
  readonly noPermission: string;

  // ─── Customize overlay (Task 9 — AC-24) ────────────────────────────
  /** Strings for the site-appearance customizer overlay (toolbar + sidebar). */
  readonly customize: AppearanceCustomizeLabels;
}

/**
 * AppearanceCustomizeLabels — i18n strings for the site-appearance
 * customizer overlay (toolbar + sidebar). Added in Task 9 to replace the
 * inline English strings temporarily introduced by Tasks 6.2 and 6.3.
 *
 * Keys mirror implementation.md §14:
 *   enterMode | exitMode | undo | redo | saveDraft | publish | resetDefaults
 *   brandIdentity | colors | light | dark | logoUpload | defaultMode
 *   published | draft | exportJson
 */
interface AppearanceCustomizeLabels {
  // ─── Mode toggle ───────────────────────────────────────────────────
  /** CTA button label for entering customize mode ("Enter Customize Mode"). */
  readonly enterMode: string;
  /** Exit button label for leaving customize mode ("Exit Customize Mode"). */
  readonly exitMode: string;

  // ─── Toolbar actions ───────────────────────────────────────────────
  /** Undo icon-button tooltip + aria-label. */
  readonly undo: string;
  /** Redo icon-button tooltip + aria-label. */
  readonly redo: string;
  /** Save Draft button label. */
  readonly saveDraft: string;
  /** Publish button label (short — distinct from `publishNow`). */
  readonly publish: string;
  /** Reset to Defaults button label. */
  readonly resetDefaults: string;

  // ─── Sidebar sections ──────────────────────────────────────────────
  /** Brand Identity section title. */
  readonly brandIdentity: string;
  /** Theme Colors section title. */
  readonly colors: string;
  /** Light mode tab/radio label. */
  readonly light: string;
  /** Dark mode tab/radio label. */
  readonly dark: string;
  /** Logo upload section title. */
  readonly logoUpload: string;
  /** Default Mode section title. */
  readonly defaultMode: string;

  // ─── Status badges ─────────────────────────────────────────────────
  /** Published status badge (short — distinct from `publishedBadge`). */
  readonly published: string;
  /** Draft status badge (short — distinct from `draftBadge`). */
  readonly draft: string;

  // ─── Misc ──────────────────────────────────────────────────────────
  /** Export JSON action label. */
  readonly exportJson: string;

  // ─── Logo upload ────────────────────────────────────────────────────
  /** Upload logo button label. */
  readonly logoUploadButton: string;
  /** Loading state label while reading file. */
  readonly logoLoading: string;
  /** File format hint under the upload button. */
  readonly logoFileHint: string;
  /** Label for an in-memory (data URL) logo preview. */
  readonly logoInMemoryPreview: string;
  /** Remove logo button label. */
  readonly logoRemove: string;
  /** Toast shown when a logo is loaded into memory. */
  readonly logoLoadedToast: string;
  /** Toast shown when the logo file exceeds the size limit. */
  readonly logoFileTooLarge: string;
  /** Toast shown when the logo file could not be read. */
  readonly logoLoadFailed: string;
  /** Primary color label. */
  readonly primaryColor: string;
  /** Secondary color label. */
  readonly secondaryColor: string;
}
