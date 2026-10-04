"use client";

import { useCallback, useState } from "react";
import type { WhatsappRecipientViewRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

/** Transient dialog-local state for the add/remove/verify recipient flows, shared by the test-recipient panel and the conversations registry. */
export function useRecipientDialogState() {
  const [addOpen, setAddOpen] = useState(false);
  const [addPhone, setAddPhone] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WhatsappRecipientViewRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
    removeTarget,
    setRemoveTarget,
    notice,
    setNotice,
    verifyingId,
    setVerifyingId,
    openAdd,
    closeAdd,
  };
}
