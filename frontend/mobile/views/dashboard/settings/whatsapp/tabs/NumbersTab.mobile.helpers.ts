import type { WhatsappTokenTestState } from "@/frontend/common/stores/whatsappTokenTestStore";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export type CredentialField = "accessToken" | "twoStepPin";

export interface CredentialDialogState {
  readonly accountId: string;
  readonly field: CredentialField;
}

export const INITIAL_CRED_STATE: CredentialDialogState = { accountId: "", field: "accessToken" };

type CredentialValidationKey = "validationAccessTokenTooShort" | "validationPinFormat";

const CRED_VALIDATION_KEYS: ReadonlySet<string> = new Set(["validationAccessTokenTooShort", "validationPinFormat"]);

function isCredValidationKey(value: string): value is CredentialValidationKey {
  return CRED_VALIDATION_KEYS.has(value);
}

export function resolveCredValidationError(key: string | null, labels: WhatsappLabels): string | null {
  if (key === null) return null;
  return isCredValidationKey(key) ? labels[key] : key;
}

export interface CredentialDialogActionsProps {
  readonly state: CredentialDialogState;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
  readonly onConfirm: (value: string) => Promise<void>;
  readonly onTest: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  readonly validate: (value: string) => string | null;
}

export function isCardBusy(
  accountId: string | null | undefined,
  localDeactivatingId: string | null,
  updatingId: string | null,
  editingTokenForId: string | null,
  editingPinForId: string | null
): boolean {
  if (!accountId) return false;
  return (
    localDeactivatingId === accountId ||
    updatingId === accountId ||
    editingTokenForId === accountId ||
    editingPinForId === accountId
  );
}
