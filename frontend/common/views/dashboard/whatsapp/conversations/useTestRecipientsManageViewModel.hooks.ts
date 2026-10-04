"use client";

import { useCallback, useMemo } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import type { WhatsappTestRecipientsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { useRecipientDialogState } from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import {
  isRecipientRow,
  TIMESTAMP_OPTIONS,
  toRecipientViewRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useTestRecipientsManageViewModel.helpers";
import { useAppLocale } from "@/shared/locale/localeContext";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

/** Transient dialog-local state for the add/remove/verify flows. */
export function useRecipientActionState() {
  return useRecipientDialogState();
}

export type RecipientActionState = ReturnType<typeof useRecipientActionState>;

/** Shapes raw registry rows into the panel's view rows, timestamps localized. */
export function useRecipientRows(
  rowsData: WhatsappTestRecipientsQuery["whatsappTestRecipients"] | undefined,
  labels: WhatsappConversationsLabels
) {
  const locale = useAppLocale();
  const formatTimestamp = useCallback(
    (iso: string | null) => {
      if (!iso) {
        return "";
      }
      const localeTag = locale === "ar" ? "ar" : "en";
      return getDateTimeFormatter(localeTag, TIMESTAMP_OPTIONS).format(new Date(iso));
    },
    [locale]
  );
  const rows = useMemo(
    () => (rowsData ?? []).filter(isRecipientRow).map(row => toRecipientViewRow(row, labels, formatTimestamp)),
    [rowsData, labels, formatTimestamp]
  );
  return rows;
}
