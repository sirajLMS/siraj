import type {
  WhatsappAccountFieldsFragment,
  WhatsappLimitTier,
  WhatsappQualityRating,
  WhatsappTemplateSnapshotFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Row model for a WhatsApp account in the settings UI. */
export type WhatsappAccountRow = WhatsappAccountFieldsFragment;

/** Row model for a WhatsApp template snapshot in the settings UI. */
export type WhatsappTemplateRow = WhatsappTemplateSnapshotFieldsFragment;

/**
 * Audit entry for a single opt-in change (Task 12).
 *
 * Represents one row in the opt-in history table. Until the backend
 * `whatsappOptInAuditQuery` resolver is implemented (tracked in Task 3),
 * these entries will be placeholder/mock data sourced from the UI layer.
 */
export interface WhatsappOptInAuditEntry {
  /** Stable unique id for the entry (UUID or sequence-derived). */
  readonly id: string;
  /** ISO date string when the change occurred. */
  readonly date: string;
  /** Whether the user opted in or out. */
  readonly action: "optIn" | "optOut";
  /** Display name of the user who made the change. */
  readonly changedBy: string;
}

/**
 * Consolidated opt-in state for a single user (Task 13).
 *
 * Represents one row in the admin consolidated opt-in view. Until the
 * backend resolver for all-users opt-in query is implemented, these
 * entries will be placeholder/mock data sourced from the UI layer.
 */
export interface WhatsappOptInUserState {
  /** Stable unique id for the user (typically the user's UUID). */
  readonly id: string;
  /** Display name of the user. */
  readonly userName: string;
  /** Whether the user has opted in to WhatsApp notifications. */
  readonly optedIn: boolean;
  /** ISO date string when the user opted in, or null if not opted in. */
  readonly optedInAt: string | null;
}

/**
 * Form values for the WhatsApp account API settings form.
 *
 * This type intentionally diverges from the generated `WhatsappAccountCreateInput`/
 * `WhatsappAccountUpdateInput` types because:
 * - Form fields are non-null (required in the form), while GraphQL uses InputMaybe
 * - The form uses flat `string` for displayName, while GraphQL uses a localized shape
 *
 * When adding/removing fields from the GraphQL input types, update this type AND
 * the form rendering logic in the settings views.
 *
 * Fields that map directly to the `WhatsappAccountCreateInput` / `WhatsappAccountUpdateInput`
 * GraphQL inputs. These are the only values sent to the API on create/update.
 */
export interface WhatsappAccountApiFormValues {
  readonly wabaId: string;
  readonly phoneNumberId: string;
  readonly displayPhoneNumber: string;
  readonly displayName: string;
  readonly isActive: boolean;
  readonly portfolioMessagingLimitTier: WhatsappLimitTier | null;
  readonly qualityRating: WhatsappQualityRating | null;
  readonly throughputLevel: string;
}

/**
 * Credential fields that are form-only — they are NOT part of the create/update
 * GraphQL inputs. Instead, `accessToken` and `twoStepPin` are sent via dedicated
 * `setWhatsappAccessToken` / `setWhatsappTwoStepPin` mutations.
 */
export interface WhatsappAccountCredentialFormValues {
  readonly accessToken: string;
  readonly twoStepPin: string;
}

/**
 * Complete form values for creating / editing a WhatsApp account.
 *
 * Combines API-sent fields with form-only credential fields. Consumers that
 * build GraphQL mutation payloads should pick from `WhatsappAccountApiFormValues`
 * only; credential values go through dedicated mutations.
 */
export type WhatsappAccountFormValues = WhatsappAccountApiFormValues & WhatsappAccountCredentialFormValues;

/**
 * Form values for the create-account form (Task 2 — activated).
 *
 * Narrower than `WhatsappAccountApiFormValues` because the create form only
 * collects three fields. The remaining API fields are populated server-side
 * or via the Meta sync flow.
 */
export interface AccountCreateFormValues {
  readonly displayName: string;
  readonly phoneNumberId: string;
  readonly wabaId: string;
}

/**
 * Form values for the access-token dialog form (Task 2 — activated).
 *
 * The access token is sent via the dedicated `setWhatsappAccessToken` mutation,
 * not as part of the account create/update payload.
 */
export interface AccessTokenFormValues {
  readonly accessToken: string;
}

/**
 * Form values for the two-step PIN dialog form (Task 2 — activated).
 *
 * The PIN is sent via the dedicated `setWhatsappTwoStepPin` mutation,
 * not as part of the account create/update payload.
 */
export interface AccountCredentialFormValues {
  readonly twoStepPin: string;
}

/** Snackbar feedback state. */
export interface WhatsappSnackbarState {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
}

/**
 * New snackbar pattern: `null` when closed, `{ message, severity }` when open.
 * Task 7 will wire `FormSuccessSnackbar`/`FormErrorSnackbar` to this shape.
 */
export type WhatsappSnackbar = { readonly message: string; readonly severity: "success" | "error" } | null;

/** Consolidated dialog state for the WhatsApp settings page. */
export interface WhatsappDialogState {
  readonly type: "create" | "editName" | "editToken" | "editPin" | "deleteConfirm" | null;
  readonly accountId?: string;
  readonly displayName?: string;
}

/** Input for the create-account handler. */
export interface WhatsappCreateInput {
  readonly displayName: string;
  readonly phoneNumberId: string;
  readonly wabaId: string;
}

/** Labels grouped by UI section (labelsBySection pattern). */
export interface WhatsappSettingsLabels {
  readonly page: WhatsappLabels;
  readonly notifications: {
    readonly syncSuccess: string;
    readonly syncNoChange: string;
    readonly syncError: string;
    readonly deleteSuccess: string;
    readonly deleteError: string;
    readonly saveSuccess: string;
    readonly saveError: string;
    readonly optInSuccess: string;
    readonly optInError: string;
  };
}

/**
 * ViewModel interface returned by useWhatsappSettingsViewModel.
 *
 * Enhanced in Task 6 with create/update mutations, per-row loading states,
 * consolidated dialog state, validation function exposure, and new snackbar pattern.
 * Existing properties are preserved for backward compatibility — `onXxx` handler
 * names are kept as aliases alongside the new `handleXxx` names.
 */
export interface WhatsappSettingsViewModel {
  // ── Data ────────────────────────────────────────────────────────────
  readonly labels: WhatsappSettingsLabels;
  readonly accounts: readonly WhatsappAccountRow[];
  readonly templates: readonly WhatsappTemplateRow[];
  readonly loading: boolean;
  readonly isOptedIn: boolean;
  readonly isConfigured: boolean;

  // ── Loading states (per-row) ─────────────────────────────────────────
  /** Is the create mutation in progress. */
  readonly creating: boolean;
  /** Which account is being deleted (null when not deleting). */
  readonly deletingId: string | null;
  /** Which account is being updated (null when not updating). */
  readonly updatingId: string | null;
  /** Which account is being synced (null when not syncing). */
  readonly syncingId: string | null;
  /** Which account's token dialog is open (null when closed). */
  readonly editingTokenForId: string | null;
  /** Which account's PIN dialog is open (null when closed). */
  readonly editingPinForId: string | null;
  /** Boolean sync alias (true when syncingId !== null). */
  readonly syncing: boolean;
  /** Opt-in toggle in progress. */
  readonly optInLoading: boolean;

  // ── Error states ──────────────────────────────────────────────────────
  /** Inline mutation error message (null when no error). */
  readonly mutationError: string | null;
  /** True when the accounts query returned an error. Templates tab uses this for retry UI. */
  readonly queryError: boolean;

  // ── Snackbar ──────────────────────────────────────────────────────────
  /** New snackbar pattern: null when closed, { message, severity } when open. */
  readonly snackbar: WhatsappSnackbar;
  /** Close the snackbar. */
  readonly closeSnackbar: () => void;

  // ── Validation functions ──────────────────────────────────────────────
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
  readonly validateAccessToken: (value: string) => string | null;
  readonly validateTwoStepPin: (value: string) => string | null;

  // ── Dialog state ─────────────────────────────────────────────────────
  readonly dialogState: WhatsappDialogState;
  readonly openCreateDialog: () => void;
  readonly openEditNameDialog: (accountId: string, displayName: string) => void;
  readonly openEditTokenDialog: (accountId: string) => void;
  readonly openEditPinDialog: (accountId: string) => void;
  readonly openDeleteConfirmDialog: (accountId: string, displayName: string) => void;
  readonly closeDialog: () => void;

  // ── Handlers ──────────────────────────────────────────────────────────
  /** Create a new WhatsApp account. Validates displayName before calling mutation. */
  readonly handleCreate: (input: WhatsappCreateInput) => Promise<void>;
  /** Update an account's display name. Validates displayName before calling mutation. */
  readonly handleEditName: (accountId: string, displayName: string) => Promise<void>;
  /** Delete an account by id. */
  readonly handleDelete: (accountId: string) => Promise<void>;
  /** Set the access token for an account. */
  readonly handleSubmitToken: (accountId: string, token: string) => Promise<void>;
  /** Set the two-step PIN for an account. */
  readonly handleSubmitPin: (accountId: string, pin: string) => Promise<void>;
  /** Sync all accounts from Meta. */
  readonly handleSync: () => Promise<void>;
  /** Toggle non-admin user opt-in. */
  readonly handleToggleOptIn: (optedIn: boolean) => Promise<void>;

  // ── Refetch ───────────────────────────────────────────────────────────
  /** Refetch accounts from the server. */
  readonly refetchAccounts: () => void;
  /** Refetch templates — triggers accounts refetch since templates come from sync. */
  readonly refetchTemplates: () => void;

  // ── Legacy aliases (backward compatibility) ──────────────────────────
  /** @deprecated Use handleDelete instead. */
  readonly onDeleteAccount: (id: string) => Promise<void>;
  /** @deprecated Use handleSubmitToken instead. */
  readonly onSetAccessToken: (id: string, accessToken: string) => Promise<void>;
  /** @deprecated Use handleSubmitPin instead. */
  readonly onSetTwoStepPin: (id: string, twoStepPin: string) => Promise<void>;
  /** @deprecated Use handleSync instead. */
  readonly onSyncFromMeta: () => Promise<void>;
  /** @deprecated Use handleToggleOptIn instead. */
  readonly onToggleOptIn: (enabled: boolean) => Promise<void>;
  /** @deprecated Use closeSnackbar instead. Name retained for existing consumers. */
  readonly onDismissSnackbar: () => void;
}
