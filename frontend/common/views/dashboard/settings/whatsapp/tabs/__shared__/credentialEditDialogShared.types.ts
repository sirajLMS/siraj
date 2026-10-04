import type { WhatsappTokenTestResult, WhatsappTokenTestState } from "@/frontend/common/stores/whatsappTokenTestStore";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/**
 * Props shared by the desktop and mobile credential-edit dialogs.
 * `State` is tier-specific (the desktop dialog state carries the in-progress value).
 */
export interface CredentialEditDialogSharedProps<State> {
  readonly open: boolean;
  readonly state: State;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
  readonly onConfirm: (value: string) => Promise<void>;
  readonly onTest: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  /** Recorded token test outcomes, keyed by `accountId -> tokenValue -> result`. */
  readonly tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>;
}
