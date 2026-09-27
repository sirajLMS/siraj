"use client";

import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import { AppPermission, WhatsappTestRecipientStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  addWhatsappTestRecipientMutationDocument,
  removeWhatsappTestRecipientMutationDocument,
  verifyWhatsappTestRecipientMutationDocument,
  whatsappTestRecipientsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { TestRecipientsPanelProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import type {
  WhatsappRecipientViewRow,
  WhatsappTestRecipientRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { parsePhoneToE164 } from "@/shared/lib/phone";
import { Translation, useAppTranslation } from "@/shared/locale";
import { useAppLocale } from "@/shared/locale/localeContext";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

const RECIPIENT_LIMIT = 5;
const WHATSAPP_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

function interpolateVar(template: string, variable: string, value: string): string {
  return template.replaceAll(`{${variable}}`, value);
}

/** Strips PhoneInput's formatted value down to the E.164 digits the API expects. */
function phoneDigitsOnly(raw: string): string {
  return raw.replaceAll(/\D/g, "");
}

function isRecipientRow(row: { id: string | null }): row is WhatsappTestRecipientRow {
  return row.id !== null;
}

/** Maps one registry row to the pre-shaped view row the panel renders. */
function toRecipientViewRow(
  row: WhatsappTestRecipientRow,
  labels: WhatsappConversationsLabels,
  formatTimestamp: (iso: string | null) => string
): WhatsappRecipientViewRow {
  const allowed = row.status === WhatsappTestRecipientStatus.Allowed;
  return {
    id: row.id,
    phoneNumber: row.phoneNumber ?? "",
    note: row.note ?? null,
    status: row.status ?? WhatsappTestRecipientStatus.Pending,
    statusLabel: allowed ? labels.recipientStatusAllowed : labels.recipientStatusPending,
    statusBadgeStatus: allowed ? "completed" : "pending",
    lastCheckedText: row.lastCheckedAt
      ? interpolateVar(labels.recipientLastChecked, "date", formatTimestamp(row.lastCheckedAt))
      : null,
    errorText: row.lastErrorCode ? interpolateVar(labels.recipientErrorCode, "code", row.lastErrorCode) : null,
  };
}

/**
 * Resolves a registry mutation rejection to user copy: dedicated errors-
 * namespace strings for known domain codes, else the server-localized message,
 * else the conversations-namespace fallback.
 */
function describeRegistryError(error: unknown, errorLabels: ErrorsLabels, fallback: string): string {
  if (CombinedGraphQLErrors.is(error)) {
    const code: unknown = error.errors[0]?.extensions?.code;
    if (code === "WHATSAPP_RECIPIENT_LIMIT_REACHED") {
      return errorLabels.whatsappRecipientLimitReached;
    }
    if (code === "WHATSAPP_RECIPIENT_CONFLICT") {
      return errorLabels.whatsappRecipientConflict;
    }
    const serverMessage: unknown = error.errors[0]?.message;
    if (typeof serverMessage === "string" && serverMessage !== "") {
      return serverMessage;
    }
  }
  logger.warn("WhatsApp test-recipient action failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  return fallback;
}

/** Transient dialog-local state for the add/remove/verify flows. */
function useRecipientActionState() {
  const [addOpen, setAddOpen] = useState(false);
  const [addPhone, setAddPhone] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WhatsappRecipientViewRow | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const openAdd = useCallback(() => {
    setAddPhone("");
    setAddNote("");
    setAddError(null);
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  return {
    addOpen,
    addPhone,
    setAddPhone,
    addNote,
    setAddNote,
    addError,
    setAddError,
    notice,
    setNotice,
    removeTarget,
    setRemoveTarget,
    verifyingId,
    setVerifyingId,
    openAdd,
    closeAdd,
  };
}

/**
 * Self-contained recipients registry stack for the settings manage dialog:
 * own query + add/remove/verify mutations scoped to the given account, so the
 * settings card affordance works without mounting the `/whatsapp` workspace.
 */
export function useTestRecipientsManageViewModel(accountId: string): TestRecipientsPanelProps {
  const labels = useAppTranslation(Translation.WhatsappConversations);
  const errorLabels = useAppTranslation(Translation.Errors);
  const locale = useAppLocale();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.WhatsappConversationsManage);
  const action = useRecipientActionState();

  const recipientsQuery = useQuery(whatsappTestRecipientsQueryDocument, {
    variables: { accountId },
    fetchPolicy: "cache-and-network",
  });
  const [addRecipient, addState] = useMutation(addWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });
  const [removeRecipient, removeState] = useMutation(removeWhatsappTestRecipientMutationDocument, {
    errorPolicy: "none",
  });
  const [verifyRecipient] = useMutation(verifyWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });

  const formatTimestamp = useCallback(
    (iso: string | null) => {
      if (!iso) {
        return "";
      }
      const localeTag = locale === "ar" ? "ar" : "en";
      return getDateTimeFormatter(localeTag, WHATSAPP_TIMESTAMP_OPTIONS).format(new Date(iso));
    },
    [locale]
  );

  const rows = useMemo(
    () =>
      (recipientsQuery.data?.whatsappTestRecipients ?? [])
        .filter(isRecipientRow)
        .map(row => toRecipientViewRow(row, labels, formatTimestamp)),
    [recipientsQuery.data, labels, formatTimestamp]
  );

  /** Save stays disabled until the phone input parses to a complete number. */
  const addPhoneValid = useMemo(() => {
    if (action.addPhone.trim() === "") {
      return false;
    }
    return parsePhoneToE164(action.addPhone).valid;
  }, [action.addPhone]);

  const onSubmitAdd = useCallback(() => {
    void (async () => {
      action.setAddError(null);
      try {
        await addRecipient({
          variables: {
            input: {
              accountId,
              phoneNumber: phoneDigitsOnly(action.addPhone),
              note: action.addNote.trim() === "" ? null : action.addNote.trim(),
            },
          },
        });
        action.closeAdd();
        await recipientsQuery.refetch();
      } catch (error) {
        action.setAddError(describeRegistryError(error, errorLabels, labels.recipientAddFailed));
      }
    })();
  }, [accountId, action, addRecipient, recipientsQuery, errorLabels, labels]);

  const onConfirmRemove = useCallback(() => {
    const target = action.removeTarget;
    if (!target) {
      return;
    }
    void (async () => {
      try {
        await removeRecipient({ variables: { recipientId: target.id } });
        action.setRemoveTarget(null);
        await recipientsQuery.refetch();
      } catch (error) {
        action.setNotice(describeRegistryError(error, errorLabels, labels.recipientAddFailed));
      }
    })();
  }, [action, removeRecipient, recipientsQuery, errorLabels, labels]);

  const onVerify = useCallback(
    (recipientId: string) => {
      void (async () => {
        action.setVerifyingId(recipientId);
        action.setNotice(null);
        try {
          await verifyRecipient({ variables: { recipientId } });
          await recipientsQuery.refetch();
        } catch (error) {
          action.setNotice(describeRegistryError(error, errorLabels, labels.recipientAddFailed));
        } finally {
          action.setVerifyingId(null);
        }
      })();
    },
    [action, verifyRecipient, recipientsQuery, errorLabels, labels]
  );

  const onAskRemove = useCallback(
    (recipientId: string) => {
      action.setRemoveTarget(rows.find(row => row.id === recipientId) ?? null);
    },
    [action, rows]
  );

  const removeConfirmText = action.removeTarget
    ? interpolateVar(labels.removeRecipientConfirm, "phone", action.removeTarget.phoneNumber)
    : "";

  return {
    labels,
    bannerLabels: labels,
    canManage,
    rows,
    loading: recipientsQuery.loading,
    limitReached: rows.length >= RECIPIENT_LIMIT,
    notice: action.notice,
    verifyingRecipientId: action.verifyingId,
    addOpen: action.addOpen,
    addPhone: action.addPhone,
    addPhoneValid,
    addNote: action.addNote,
    addError: action.addError,
    busy: addState.loading || removeState.loading,
    removeTarget: action.removeTarget,
    removeConfirmText,
    onOpenAdd: action.openAdd,
    onCloseAdd: action.closeAdd,
    onAddPhoneChange: action.setAddPhone,
    onAddNoteChange: action.setAddNote,
    onSubmitAdd,
    onAskRemove,
    onCloseRemove: () => action.setRemoveTarget(null),
    onConfirmRemove,
    onVerify,
  };
}
