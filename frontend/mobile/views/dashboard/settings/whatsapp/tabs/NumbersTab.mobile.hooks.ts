"use client";

import { useCallback, useState } from "react";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  type CredentialDialogState,
  type CredentialField,
  INITIAL_CRED_STATE,
} from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.helpers";

export interface MobileCredMenuState {
  readonly menuAnchorEl: null | HTMLElement;
  readonly menuAccount: WhatsappAccountRow | null;
  readonly credDialogOpen: boolean;
  readonly credDialogState: CredentialDialogState;
  readonly handleMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly handleMenuClose: () => void;
  readonly openCredDialog: (field: CredentialField) => void;
  readonly handleCredDialogClose: () => void;
  readonly handleCredDialogConfirm: (value: string) => Promise<void>;
}

export function useMobileCredMenuState(
  onSetAccessToken: (id: string, token: string) => Promise<void>,
  onSetTwoStepPin: (id: string, pin: string) => Promise<void>
): MobileCredMenuState {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAccount, setMenuAccount] = useState<WhatsappAccountRow | null>(null);
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [credDialogState, setCredDialogState] = useState<CredentialDialogState>(INITIAL_CRED_STATE);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuAccount(account);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const openCredDialog = useCallback(
    (field: CredentialField) => {
      if (!menuAccount?.id) return;
      setCredDialogState({ accountId: menuAccount.id, field });
      setCredDialogOpen(true);
    },
    [menuAccount]
  );

  const handleCredDialogClose = useCallback(() => {
    setCredDialogOpen(false);
  }, []);

  const handleCredDialogConfirm = useCallback(
    async (value: string) => {
      if (credDialogState.field === "accessToken") {
        await onSetAccessToken(credDialogState.accountId, value);
      } else {
        await onSetTwoStepPin(credDialogState.accountId, value);
      }
      setCredDialogOpen(false);
    },
    [credDialogState, onSetAccessToken, onSetTwoStepPin]
  );

  return {
    menuAnchorEl,
    menuAccount,
    credDialogOpen,
    credDialogState,
    handleMenuOpen,
    handleMenuClose,
    openCredDialog,
    handleCredDialogClose,
    handleCredDialogConfirm,
  };
}

export interface NumbersMenuHandlers {
  readonly credValidate: (value: string) => string | null;
  readonly credLoading: boolean;
  readonly handleLocalDeactivateConfirm: () => Promise<void>;
  readonly handleEditNameFromMenu: () => void;
  readonly handleEditTokenFromMenu: () => void;
  readonly handleEditPinFromMenu: () => void;
  readonly handleLocalDeactivateFromMenu: () => void;
}

export function useNumbersMenuHandlers(
  props: Readonly<NumbersTabSharedProps>,
  credMenu: Readonly<MobileCredMenuState>
): NumbersMenuHandlers {
  const { validateAccessToken, validateTwoStepPin, editingTokenForId, editingPinForId } = props;
  const { onLocalDeactivateAccount, onCloseDialog, onOpenEditNameDialog, onLocalDeactivateConfirmDialog } = props;
  const credValidate = credMenu.credDialogState.field === "accessToken" ? validateAccessToken : validateTwoStepPin;
  const credLoading =
    (editingTokenForId !== null && editingTokenForId === credMenu.credDialogState.accountId) ||
    (editingPinForId !== null && editingPinForId === credMenu.credDialogState.accountId);

  const handleLocalDeactivateConfirm = useCallback(async () => {
    const accountId = props.dialogState.accountId;
    if (!accountId) return;
    await onLocalDeactivateAccount(accountId);
    onCloseDialog();
  }, [props.dialogState.accountId, onLocalDeactivateAccount, onCloseDialog]);

  const handleEditNameFromMenu = useCallback(() => {
    if (!credMenu.menuAccount?.id) return;
    onOpenEditNameDialog(
      credMenu.menuAccount.id,
      credMenu.menuAccount.displayName?.en ?? "",
      credMenu.menuAccount.purpose ?? WhatsappAccountPurpose.General
    );
  }, [credMenu.menuAccount, onOpenEditNameDialog]);

  const handleEditTokenFromMenu = useCallback(() => {
    credMenu.openCredDialog("accessToken");
  }, [credMenu]);

  const handleEditPinFromMenu = useCallback(() => {
    credMenu.openCredDialog("twoStepPin");
  }, [credMenu]);

  const handleLocalDeactivateFromMenu = useCallback(() => {
    if (!credMenu.menuAccount?.id) return;
    const accountLabel =
      credMenu.menuAccount.displayName?.en ?? credMenu.menuAccount.displayPhoneNumber ?? credMenu.menuAccount.id ?? "";
    onLocalDeactivateConfirmDialog(credMenu.menuAccount.id, accountLabel);
  }, [credMenu.menuAccount, onLocalDeactivateConfirmDialog]);

  return {
    credValidate,
    credLoading,
    handleLocalDeactivateConfirm,
    handleEditNameFromMenu,
    handleEditTokenFromMenu,
    handleEditPinFromMenu,
    handleLocalDeactivateFromMenu,
  };
}
