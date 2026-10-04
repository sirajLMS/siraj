import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export type CredentialDialogField = "accessToken" | "twoStepPin";

export interface CredentialDialogState {
  readonly accountId: string;
  readonly field: CredentialDialogField;
  readonly value: string;
}

export const INITIAL_DIALOG_STATE: CredentialDialogState = {
  accountId: "",
  field: "accessToken",
  value: "",
};

export interface CredentialMenuState {
  readonly anchorEl: null | HTMLElement;
  readonly dialogMode: CredentialDialogState;
  readonly dialogOpen: boolean;
  readonly handleMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly handleMenuClose: () => void;
  readonly handleEditNameFromMenu: () => void;
  readonly openCredentialDialog: (field: CredentialDialogField) => void;
  readonly handleDialogClose: () => void;
  readonly handleDialogConfirm: (value: string) => Promise<void>;
}
