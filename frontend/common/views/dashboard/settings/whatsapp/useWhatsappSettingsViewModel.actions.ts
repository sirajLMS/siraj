import type { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappCreateInput,
  WhatsappSettingsLabels,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  buildCreateInput,
  buildUpdateInput,
  type SnackbarShow,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.helpers";

export async function localDeactivateAccountAction(
  id: string,
  localDeactivateAccount: (opts: { variables: { id: string } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await localDeactivateAccount({ variables: { id } });
    await refetchAccounts();
    showSnackbar(labels.localDeactivateSuccess, "success");
  } catch (error) {
    logger.error("Failed to locally deactivate WhatsApp account", { error });
    showSnackbar(labels.localDeactivateError, "error");
  }
}

export async function setAccessTokenAction(
  id: string,
  accessToken: string,
  setAccessToken: (opts: { variables: { id: string; accessToken: string } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await setAccessToken({ variables: { id, accessToken } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to set WhatsApp access token", { error });
    showSnackbar(labels.saveError, "error");
  }
}

export async function setTwoStepPinAction(
  id: string,
  twoStepPin: string,
  setTwoStepPin: (opts: { variables: { id: string; twoStepPin: string } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await setTwoStepPin({ variables: { id, twoStepPin } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to set WhatsApp two-step PIN", { error });
    showSnackbar(labels.saveError, "error");
  }
}

export async function createAccountAction(
  input: WhatsappCreateInput,
  createAccount: (opts: { variables: { input: ReturnType<typeof buildCreateInput> } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await createAccount({ variables: { input: buildCreateInput(input) } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to create WhatsApp account", { error });
    showSnackbar(labels.saveError, "error");
    throw error;
  }
}

export async function updateAccountAction(
  accountId: string,
  displayName: string,
  updateAccount: (opts: { variables: { id: string; input: ReturnType<typeof buildUpdateInput> } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await updateAccount({ variables: { id: accountId, input: buildUpdateInput(displayName) } });
    await refetchAccounts();
    showSnackbar(labels.saveSuccess, "success");
  } catch (error) {
    logger.error("Failed to update WhatsApp account", { error });
    showSnackbar(labels.saveError, "error");
    throw error;
  }
}

export async function updatePurposeAction(
  accountId: string,
  purpose: WhatsappAccountPurpose,
  updatePurpose: (opts: { variables: { accountId: string; purpose: WhatsappAccountPurpose } }) => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  labels: Pick<WhatsappSettingsLabels["page"], "purposeUpdated" | "purposeUpdateFailed">,
  showSnackbar: SnackbarShow
): Promise<void> {
  try {
    await updatePurpose({ variables: { accountId, purpose } });
    await refetchAccounts();
    showSnackbar(labels.purposeUpdated, "success");
  } catch (error) {
    logger.error("Failed to update WhatsApp account purpose", { error });
    showSnackbar(labels.purposeUpdateFailed, "error");
  }
}
