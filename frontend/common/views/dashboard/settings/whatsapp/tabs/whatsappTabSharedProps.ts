import type {
  WhatsappAccountRow,
  WhatsappSettingsLabels,
  WhatsappSnackbarState,
  WhatsappTemplateRow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export interface NumbersTabSharedProps {
  readonly labels: WhatsappSettingsLabels;
  readonly accounts: readonly WhatsappAccountRow[];
  readonly loading: boolean;
  readonly syncing: boolean;
  readonly snackbar: WhatsappSnackbarState;
  readonly onDeleteAccount: (id: string) => Promise<void>;
  readonly onSetAccessToken: (id: string, accessToken: string) => Promise<void>;
  readonly onSetTwoStepPin: (id: string, twoStepPin: string) => Promise<void>;
  readonly onSyncFromMeta: () => Promise<void>;
  readonly onDismissSnackbar: () => void;
  readonly isConfigured: boolean;
}

export interface TemplatesTabSharedProps {
  readonly labels: WhatsappSettingsLabels;
  readonly templates: readonly WhatsappTemplateRow[];
  readonly loading: boolean;
  readonly syncing: boolean;
  readonly onSyncFromMeta: () => Promise<void>;
  readonly isConfigured: boolean;
}

export interface OptInTabSharedProps {
  readonly labels: WhatsappSettingsLabels;
  readonly isOptedIn: boolean;
  readonly optInLoading: boolean;
  readonly onToggleOptIn: (enabled: boolean) => Promise<void>;
}
