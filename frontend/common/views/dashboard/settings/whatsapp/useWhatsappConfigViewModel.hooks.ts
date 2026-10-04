"use client";

import { useApolloClient } from "@apollo/client/react";
import { useCallback, useState } from "react";
import {
  generateWhatsappVerifyTokenQueryDocument,
  testWhatsappConnectionQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappConfigConnectionResult,
  WhatsappConfigFormField,
  WhatsappConfigFormValues,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Snackbar notification signature shared by the config tab's actions. */
type SnackbarShow = (message: string, severity: "success" | "error") => void;

function areValuesEqual(a: WhatsappConfigFormValues, b: WhatsappConfigFormValues): boolean {
  return (
    a.appId === b.appId &&
    a.appSecret === b.appSecret &&
    a.verifyToken === b.verifyToken &&
    a.phoneNumberId === b.phoneNumberId &&
    a.wabaId === b.wabaId &&
    a.accessToken === b.accessToken &&
    a.esConfigId === b.esConfigId
  );
}

/**
 * Draft-based form state: without a draft the inputs mirror the server
 * baseline (so refetches keep the form fresh); the first keystroke creates a
 * draft that then wins over any server change until it is reset on save.
 */
export function useWhatsappConfigForm(baseline: WhatsappConfigFormValues) {
  const [draft, setDraft] = useState<WhatsappConfigFormValues | null>(null);

  const values = draft ?? baseline;

  const onFieldChange = useCallback(
    (field: WhatsappConfigFormField, value: string) => {
      setDraft(previous => ({ ...(previous ?? baseline), [field]: value }));
    },
    [baseline]
  );

  const resetDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const dirty = draft !== null && areValuesEqual(draft, baseline);

  return { values, onFieldChange, resetDraft, dirty };
}

/**
 * Runs the server-side WhatsApp connection test over the network and keeps
 * the latest result plus the in-flight flag; transport failures surface as
 * a failure result so the UI can render the localized error message.
 */
export function useWhatsappConnectionTest(labels: Pick<WhatsappLabels, "configTestConnectionError">) {
  const client = useApolloClient();
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<WhatsappConfigConnectionResult | null>(null);

  const onTestConnection = useCallback(async () => {
    setTesting(true);
    try {
      const { data } = await client.query({
        query: testWhatsappConnectionQueryDocument,
        fetchPolicy: "network-only",
      });
      const result = data?.testWhatsappConnection;
      setConnectionResult(
        result
          ? { success: result.success === true, message: result.message ?? "", phoneNumber: result.phoneNumber ?? null }
          : null
      );
    } catch (error) {
      logger.error("Failed to run the WhatsApp connection test", { error });
      setConnectionResult({ success: false, message: labels.configTestConnectionError, phoneNumber: null });
    } finally {
      setTesting(false);
    }
  }, [client, labels]);

  return { testing, connectionResult, onTestConnection };
}

/**
 * Requests a freshly generated verify token from the server and writes it
 * into the form's `verifyToken` field; an empty token is silently ignored so
 * the user's existing draft value is never clobbered with a blank.
 */
export function useWhatsappVerifyTokenGenerator(
  labels: Pick<WhatsappLabels, "configTokenGenerated" | "configTokenGenerateError">,
  onFieldChange: (field: WhatsappConfigFormField, value: string) => void,
  showSnackbar: SnackbarShow
) {
  const client = useApolloClient();
  const [generating, setGenerating] = useState(false);

  const onGenerateToken = useCallback(async () => {
    setGenerating(true);
    try {
      const { data } = await client.query({
        query: generateWhatsappVerifyTokenQueryDocument,
        fetchPolicy: "network-only",
      });
      const token = data?.generateWhatsappVerifyToken ?? "";
      if (token.length > 0) {
        onFieldChange("verifyToken", token);
        showSnackbar(labels.configTokenGenerated, "success");
      }
    } catch (error) {
      logger.error("Failed to generate a WhatsApp verify token", { error });
      showSnackbar(labels.configTokenGenerateError, "error");
    } finally {
      setGenerating(false);
    }
  }, [client, labels, onFieldChange, showSnackbar]);

  return { generating, onGenerateToken };
}
