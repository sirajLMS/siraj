import { logger } from "@/frontend/common/utils/logger";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { SnackbarShow } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.helpers";
import { CURRENT_USER } from "@/shared/constants/whatsapp-current-user";

interface SyncFromMetaResult {
  data?: { syncWhatsappAccountsFromMeta?: { accounts?: unknown[] | null } };
}

function isSyncFromMetaResult(value: unknown): value is SyncFromMetaResult {
  return (
    typeof value === "object" &&
    value !== null &&
    ("data" in value ? typeof value.data === "object" || value.data === undefined : true)
  );
}

/** Extracts phoneNumberId values from the untyped sync-mutation account entries. */
function syncedAccountPhoneIds(accounts: unknown[] | null | undefined): string[] {
  if (!accounts) {
    return [];
  }
  return accounts.flatMap(account => {
    if (typeof account !== "object" || account === null) {
      return [];
    }
    const phoneNumberId: unknown = Reflect.get(account, "phoneNumberId");
    return typeof phoneNumberId === "string" ? [phoneNumberId] : [];
  });
}

/**
 * Runs the Meta sync and reports real outcome feedback: how many numbers Meta
 * returned and how many were newly added versus already managed. A bare
 * "success" misleads when the WABA has no numbers or all are already known.
 */
export async function syncFromMetaAction(
  syncFromMeta: () => Promise<unknown>,
  refetchAccounts: () => Promise<unknown>,
  previousPhoneNumberIds: ReadonlySet<string>,
  setSyncing: (value: boolean) => void,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  setSyncing(true);
  try {
    const rawResult = await syncFromMeta();
    const result: SyncFromMetaResult = isSyncFromMetaResult(rawResult) ? rawResult : {};
    const syncedIds = syncedAccountPhoneIds(result.data?.syncWhatsappAccountsFromMeta?.accounts);
    await refetchAccounts();
    if (syncedIds.length > 0) {
      const addedCount = syncedIds.filter(id => !previousPhoneNumberIds.has(id)).length;
      showSnackbar(labels.syncSuccessWithCounts(syncedIds.length, addedCount), "success");
    } else {
      showSnackbar(labels.syncNoChange, "success");
    }
  } catch (error) {
    logger.error("Failed to sync from Meta", { error });
    showSnackbar(labels.syncError, "error");
  } finally {
    setSyncing(false);
  }
}

export async function toggleOptInAction(
  enabled: boolean,
  setOptIn: (opts: { variables: { userId: string; enabled: boolean; source: string } }) => Promise<unknown>,
  refetchOptIn: () => Promise<unknown>,
  setOptInLoading: (value: boolean) => void,
  labels: WhatsappSettingsLabels["notifications"],
  showSnackbar: SnackbarShow
): Promise<void> {
  setOptInLoading(true);
  try {
    await setOptIn({ variables: { userId: CURRENT_USER, enabled, source: "graphql" } });
    await refetchOptIn();
    showSnackbar(labels.optInSuccess, "success");
  } catch (error) {
    logger.error("Failed to toggle WhatsApp opt-in", { error });
    showSnackbar(labels.optInError, "error");
  } finally {
    setOptInLoading(false);
  }
}
