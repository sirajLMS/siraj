import type { WhatsappConfigurationFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Editable fields of the Cloud API configuration form. */
export type WhatsappConfigFormField =
  | "appId"
  | "appSecret"
  | "verifyToken"
  | "phoneNumberId"
  | "wabaId"
  | "accessToken"
  | "esConfigId";

/** Current input values of the configuration form (secrets start empty). */
export type WhatsappConfigFormValues = Readonly<Record<WhatsappConfigFormField, string>>;

/** Validation keys resolvable through `WhatsappLabels` (pure-validators pattern). */
export type WhatsappConfigValidationKey =
  | "validationAppIdNumeric"
  | "validationPhoneNumberIdNumeric"
  | "validationWabaIdNumeric"
  | "validationMaxLength";

/** Normalized result of the manual connection test. */
export interface WhatsappConfigConnectionResult {
  readonly success: boolean;
  /** Pre-localized message returned by the backend test. */
  readonly message: string;
  readonly phoneNumber: string | null;
}

/**
 * View model for the WhatsApp Cloud API configuration tab. The configuration
 * query/mutation state flows through here; tier files
 * (`ConfigTab.desktop/.mobile`) render from these props only.
 */
export interface WhatsappConfigTabViewModel {
  readonly labels: WhatsappLabels;
  /** Masked configuration view from the server (null while loading/unavailable). */
  readonly config: WhatsappConfigurationFieldsFragment | null;
  readonly loading: boolean;
  readonly queryError: boolean;
  /** True when the viewer holds the manage permission (editing affordances). */
  readonly canManage: boolean;
  readonly values: WhatsappConfigFormValues;
  /** Per-field validation key (only set for invalid non-empty input). */
  readonly fieldErrors: Readonly<Partial<Record<WhatsappConfigFormField, WhatsappConfigValidationKey>>>;
  /** True when any input differs from the server state (Save affordance). */
  readonly dirty: boolean;
  readonly saving: boolean;
  readonly testing: boolean;
  readonly generating: boolean;
  readonly connectionResult: WhatsappConfigConnectionResult | null;
  readonly snackbar: WhatsappSnackbar;
  readonly onFieldChange: (field: WhatsappConfigFormField, value: string) => void;
  readonly onSave: () => Promise<void>;
  readonly onTestConnection: () => Promise<void>;
  readonly onGenerateToken: () => Promise<void>;
  readonly onCopy: (value: string | null) => void;
  readonly onDismissSnackbar: () => void;
  readonly onRetry: () => void;
}
