"use client";

import { useCallback, useState } from "react";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappTokenTestResult, WhatsappTokenTestState } from "@/frontend/common/stores/whatsappTokenTestStore";
import { resolveTokenTestFailureText } from "@/frontend/common/views/dashboard/settings/whatsapp/tokenTestFailureText";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  type CredentialDialogField,
  type CredentialDialogState,
  type CredentialMenuState,
  INITIAL_DIALOG_STATE,
} from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.helpers";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function useCredentialMenuState(
  onSetAccessToken: (id: string, token: string) => Promise<void>,
  onSetTwoStepPin: (id: string, pin: string) => Promise<void>,
  onOpenEditNameDialog: (accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => void
): CredentialMenuState {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAccount, setMenuAccount] = useState<WhatsappAccountRow | null>(null);
  const [dialogMode, setDialogMode] = useState<CredentialDialogState>(INITIAL_DIALOG_STATE);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => {
    setAnchorEl(event.currentTarget);
    setMenuAccount(account);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleEditNameFromMenu = useCallback(() => {
    if (!menuAccount?.id) return;
    onOpenEditNameDialog(
      menuAccount.id,
      menuAccount.displayName?.en ?? "",
      menuAccount.purpose ?? WhatsappAccountPurpose.General
    );
  }, [menuAccount, onOpenEditNameDialog]);

  const openCredentialDialog = useCallback(
    (field: CredentialDialogField) => {
      if (!menuAccount?.id) return;
      setDialogMode({ accountId: menuAccount.id, field, value: "" });
      setDialogOpen(true);
    },
    [menuAccount]
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleDialogConfirm = useCallback(
    async (value: string) => {
      if (dialogMode.field === "accessToken") {
        await onSetAccessToken(dialogMode.accountId, value);
      } else {
        await onSetTwoStepPin(dialogMode.accountId, value);
      }
      setDialogOpen(false);
    },
    [dialogMode, onSetAccessToken, onSetTwoStepPin]
  );

  return {
    anchorEl,
    dialogMode,
    dialogOpen,
    handleMenuOpen,
    handleMenuClose,
    handleEditNameFromMenu,
    openCredentialDialog,
    handleDialogClose,
    handleDialogConfirm,
  };
}

export function useCredentialEditForm(
  state: CredentialDialogState,
  labels: WhatsappLabels,
  onClose: () => void,
  onConfirm: (value: string) => Promise<void>,
  onTest: (accountId: string, token: string) => Promise<WhatsappTokenTestState>,
  tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>
) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleClose = useCallback(() => {
    setValue("");
    setShowToken(false);
    onClose();
  }, [onClose]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(value);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (testing || value.length === 0) return;
    setTesting(true);
    try {
      await onTest(state.accountId, value);
    } finally {
      setTesting(false);
    }
  };

  const isToken = state.field === "accessToken";
  const title = isToken ? labels.editToken : labels.editPin;
  const fieldLabel = isToken ? labels.accessToken : labels.twoStepPin;
  const placeholder = isToken ? labels.accessTokenPlaceholder : labels.twoStepPinPlaceholder;
  const tokenTestResult = isToken ? tokenTestStates[state.accountId]?.[value] : undefined;
  const testState = tokenTestResult?.state;
  const testFailureText = tokenTestResult ? resolveTokenTestFailureText(labels, tokenTestResult) : null;
  const testFailed = testState === "failed";

  // For the token dialog, Save is gated on a successful test of the CURRENT
  // value; for the PIN dialog, only non-empty and not submitting.
  const saveDisabled = isToken
    ? submitting || testing || value.length === 0 || testState !== "success"
    : submitting || value.length === 0;

  return {
    value,
    setValue,
    submitting,
    testing,
    showToken,
    setShowToken,
    handleClose,
    handleConfirm,
    handleTest,
    isToken,
    title,
    fieldLabel,
    placeholder,
    testState,
    testFailed,
    testFailureText,
    saveDisabled,
  };
}
