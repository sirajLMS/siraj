import type { WhatsappLimitTier, WhatsappQualityRating } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  WhatsappAccountFieldsFragment,
  WhatsappTemplateSnapshotFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Row model for a WhatsApp account in the settings UI. */
export type WhatsappAccountRow = WhatsappAccountFieldsFragment;

/** Row model for a WhatsApp template snapshot in the settings UI. */
export type WhatsappTemplateRow = WhatsappTemplateSnapshotFieldsFragment;

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

/** Snackbar feedback state. */
export interface WhatsappSnackbarState {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
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

/** ViewModel interface returned by useWhatsappSettingsViewModel. */
export interface WhatsappSettingsViewModel {
  readonly labels: WhatsappSettingsLabels;
  readonly accounts: readonly WhatsappAccountRow[];
  readonly templates: readonly WhatsappTemplateRow[];
  readonly loading: boolean;
  readonly syncing: boolean;
  readonly optInLoading: boolean;
  readonly isOptedIn: boolean;
  readonly isConfigured: boolean;
  readonly snackbar: WhatsappSnackbarState;
  readonly onDeleteAccount: (id: string) => Promise<void>;
  readonly onSetAccessToken: (id: string, accessToken: string) => Promise<void>;
  readonly onSetTwoStepPin: (id: string, twoStepPin: string) => Promise<void>;
  readonly onSyncFromMeta: () => Promise<void>;
  readonly onToggleOptIn: (enabled: boolean) => Promise<void>;
  readonly onDismissSnackbar: () => void;
}
