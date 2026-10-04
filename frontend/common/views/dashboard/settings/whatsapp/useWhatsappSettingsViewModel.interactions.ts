"use client";

import { useCallback, useState } from "react";
import {
  useWhatsappTokenTestStore,
  type WhatsappTokenTestState,
} from "@/frontend/common/stores/whatsappTokenTestStore";
import { logger } from "@/frontend/common/utils/logger";
import type { WhatsappEmbeddedSignupPayload } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  setAccessTokenAction,
  setTwoStepPinAction,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.actions";
import type { WhatsappHandlersArgs } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.handlers";
import type { useWhatsappMutations } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.hooks";
import {
  syncFromMetaAction,
  toggleOptInAction,
} from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.syncActions";

export function useWhatsappEmbeddedSignupHandler({
  mutations,
  queries,
  labels,
  showSnackbar,
}: Pick<WhatsappHandlersArgs, "mutations" | "queries" | "labels" | "showSnackbar">) {
  const [embeddedSignupSubmitting, setEmbeddedSignupSubmitting] = useState(false);

  const handleEmbeddedSignupComplete = useCallback(
    async (payload: WhatsappEmbeddedSignupPayload) => {
      setEmbeddedSignupSubmitting(true);
      try {
        await mutations.completeEmbeddedSignup({
          variables: {
            input: {
              code: payload.code,
              wabaId: payload.wabaId,
              phoneNumberId: payload.phoneNumberId ?? null,
              businessId: payload.businessId ?? null,
            },
          },
        });
        await queries.accountsQuery.refetch();
        showSnackbar(labels.page.embeddedSignupSuccessTitle, "success");
      } catch (error) {
        logger.error("Failed to complete WhatsApp embedded signup", { error });
        showSnackbar(labels.notifications.saveError, "error");
        // Rethrow — the dialog maps a rejected completion onto its error phase.
        throw error;
      } finally {
        setEmbeddedSignupSubmitting(false);
      }
    },
    [mutations, queries, labels, showSnackbar]
  );

  return { embeddedSignupSubmitting, handleEmbeddedSignupComplete };
}

export function useWhatsappUtilityHandlers({
  mutations,
  queries,
  labels,
  showSnackbar,
}: Pick<WhatsappHandlersArgs, "mutations" | "queries" | "labels" | "showSnackbar">) {
  const [syncing, setSyncing] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);

  const handleSubmitToken = useCallback(
    async (accountId: string, token: string) => {
      await setAccessTokenAction(
        accountId,
        token,
        mutations.setAccessToken,
        queries.accountsQuery.refetch,
        labels.notifications,
        showSnackbar
      );
    },
    [mutations, queries, labels, showSnackbar]
  );

  const handleSubmitPin = useCallback(
    async (accountId: string, pin: string) => {
      await setTwoStepPinAction(
        accountId,
        pin,
        mutations.setTwoStepPin,
        queries.accountsQuery.refetch,
        labels.notifications,
        showSnackbar
      );
    },
    [mutations, queries, labels, showSnackbar]
  );

  const handleSync = useCallback(async () => {
    // Snapshot the known numbers before syncing so the snackbar can report
    // how many were newly added versus already managed.
    const previousPhoneNumberIds = new Set(
      (queries.accountsQuery.data?.whatsappAccounts ?? [])
        .map(account => account.phoneNumberId)
        .filter((phoneNumberId): phoneNumberId is string => typeof phoneNumberId === "string" && phoneNumberId !== "")
    );
    await syncFromMetaAction(
      mutations.syncFromMeta,
      queries.accountsQuery.refetch,
      previousPhoneNumberIds,
      setSyncing,
      labels.notifications,
      showSnackbar
    );
  }, [mutations, queries, labels, showSnackbar]);

  const handleToggleOptIn = useCallback(
    async (optedIn: boolean) => {
      await toggleOptInAction(
        optedIn,
        mutations.setOptIn,
        queries.optInQuery.refetch,
        setOptInLoading,
        labels.notifications,
        showSnackbar
      );
    },
    [mutations, queries, labels, showSnackbar]
  );

  return { syncing, optInLoading, handleSubmitToken, handleSubmitPin, handleSync, handleToggleOptIn };
}

export function useWhatsappTokenTestHandler(mutations: ReturnType<typeof useWhatsappMutations>) {
  const setTokenTest = useWhatsappTokenTestStore(store => store.setTokenTest);

  const handleTestToken = useCallback(
    async (accountId: string, token: string): Promise<WhatsappTokenTestState> => {
      try {
        const { data } = await mutations.testAccessToken({ variables: { id: accountId, accessToken: token } });
        const result = data?.testWhatsappAccessToken;
        const passed = result?.isValid === true && result?.isConnected === true;
        const state: WhatsappTokenTestState = passed ? "success" : "failed";
        setTokenTest(accountId, token, {
          state,
          reason: passed ? null : (result?.reason ?? null),
          failureKind: passed ? null : (result?.failureKind ?? null),
        });
        return state;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.logDomainError("Failed to test WhatsApp access token", { error: message });
        // The request was rejected by our server (auth/validation/GraphQL) —
        // Meta was never asked. failureKind stays null so the UI shows the
        // "request rejected" hint instead of a Meta-token hint.
        setTokenTest(accountId, token, { state: "failed", reason: message, failureKind: null });
        return "failed";
      }
    },
    [mutations, setTokenTest]
  );

  return { handleTestToken };
}
