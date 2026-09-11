import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappTokenTestResult, WhatsappTokenTestState } from "@/frontend/common/stores/whatsappTokenTestStore";
import type {
  WhatsappAccountRow,
  WhatsappCreateInput,
  WhatsappDialogState,
  WhatsappEmbeddedSignupPayload,
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
  WhatsappSettingsLabels,
  WhatsappSnackbar,
  WhatsappTemplateRow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export interface NumbersTabSharedProps {
  readonly labels: WhatsappSettingsLabels;
  readonly accounts: readonly WhatsappAccountRow[];
  readonly loading: boolean;
  readonly syncing: boolean;
  readonly snackbar: WhatsappSnackbar;
  readonly localDeactivatingId: string | null;
  /** Per-row syncing id (null or "all" when bulk syncing). */
  readonly syncingId: string | null;
  /** Open the local-deactivation confirmation dialog for a specific account. */
  readonly onLocalDeactivateConfirmDialog: (accountId: string, displayName: string) => void;
  /** Open the recipients manage dialog for a test-number account. */
  readonly onOpenManageRecipients: (accountId: string) => void;
  readonly onLocalDeactivateAccount: (id: string) => Promise<void>;
  readonly onSetAccessToken: (id: string, accessToken: string) => Promise<void>;
  /** Validate a token against Meta (no persistence); records the outcome in the store. */
  readonly onTestAccessToken: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  /** Recorded token test outcomes, keyed by `accountId -> tokenValue -> state`. */
  readonly tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>;
  readonly onSetTwoStepPin: (id: string, twoStepPin: string) => Promise<void>;
  readonly onSyncFromMeta: () => Promise<void>;
  readonly onDismissSnackbar: () => void;
  readonly isConfigured: boolean;
  /** "Why disabled" tooltip for the Sync-from-Meta header action (busy label or missing env keys). */
  readonly syncDisabledReason?: string;
  // ── Credential dialog loading (Task 14) ──
  /** Which account's token dialog is open (null when closed). */
  readonly editingTokenForId: string | null;
  /** Which account's PIN dialog is open (null when closed). */
  readonly editingPinForId: string | null;
  // ── Create / Edit Name dialog props (Task 8) ──
  /** Create mutation in progress. */
  readonly creating: boolean;
  /** Account being updated (null when not updating). */
  readonly updatingId: string | null;
  /** Consolidated dialog state from the ViewModel. */
  readonly dialogState: WhatsappDialogState;
  /** Inline mutation error message (null when no error). */
  readonly mutationError: string | null;
  /** Create a new WhatsApp account. */
  readonly onCreate: (input: WhatsappCreateInput) => Promise<void>;
  /** Edit an account's display name. */
  readonly onEditName: (accountId: string, displayName: string) => Promise<void>;
  /** Assign a routing purpose (gated mutation — rejects inactive accounts server-side). */
  readonly onUpdatePurpose: (accountId: string, purpose: WhatsappAccountPurpose) => Promise<void>;
  /** Open the create dialog. */
  readonly onOpenCreateDialog: () => void;
  /** Open the edit-name dialog for a specific account, pre-selecting its current purpose. */
  readonly onOpenEditNameDialog: (accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => void;
  /** Close any open dialog. */
  readonly onCloseDialog: () => void;
  // ── Validation functions (Task 8) ──
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
  readonly validatePurpose: (value: string) => string | null;
  // ── Embedded signup (coexistence onboarding) ──
  /** Server-resolved ES `config_id` (null disables the connect flow). */
  readonly esConfigId?: string | null;
  /** Server-resolved Meta App ID for the FB SDK init. */
  readonly esAppId?: string | null;
  /** Meta App Dashboard "Facebook Login for Business" settings URL for registering allowed origins, resolved via GraphQL (null when not configured). */
  readonly embeddedSignupAllowedOriginsUrl?: string | null;
  /** Open the embedded signup dialog. */
  readonly onOpenEmbeddedSignup?: () => void;
  /** True when plain-HTTP serving blocks the FB login flow (disables the connect button with a hint). */
  readonly embeddedSignupBlocked?: boolean;
  /** Submit the captured ES session payload (mutation + refetch). */
  readonly onEmbeddedSignupComplete?: (payload: WhatsappEmbeddedSignupPayload) => Promise<void>;
  // ── Credential validation ──
  readonly validateAccessToken: (value: string) => string | null;
  readonly validateTwoStepPin: (value: string) => string | null;
}

export interface TemplatesTabSharedProps {
  readonly labels: WhatsappSettingsLabels;
  readonly templates: readonly WhatsappTemplateRow[];
  readonly loading: boolean;
  readonly syncing: boolean;
  readonly onSyncFromMeta: () => Promise<void>;
  readonly isConfigured: boolean;
  /** Error state from the accounts query (templates derive from sync snapshot). */
  readonly queryError: boolean;
  /** Retry handler for when the query fails. */
  readonly onRetry: () => void;
}

export interface OptInTabSharedProps {
  readonly labels: WhatsappSettingsLabels;
  readonly isOptedIn: boolean;
  readonly optInLoading: boolean;
  readonly onToggleOptIn: (enabled: boolean) => Promise<void>;
  // ── Opt-in history table (Task 12) ──
  /** Audit entries for the opt-in history table. Empty array when no data. */
  readonly auditEntries: readonly WhatsappOptInAuditEntry[];
  /** Date range filter state. */
  readonly dateRange: { readonly from: string | null; readonly to: string | null };
  /** Handler called when the date range filter changes. */
  readonly onDateRangeChange: (range: { from: string | null; to: string | null }) => void;
  /** Export the audit entries to CSV (includes filtered entries). */
  readonly onExportCsv: () => void;
  // ── Admin consolidated opt-in view (Task 13) ──
  /** All users' opt-in states for the admin consolidated view. Empty array when no data. */
  readonly adminUsers: readonly WhatsappOptInUserState[];
}
