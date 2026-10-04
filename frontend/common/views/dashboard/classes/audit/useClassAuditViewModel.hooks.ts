"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import {
  AppPermission,
  type ClassInstanceQuery_classInstance,
  type ClassStatusEventsQuery_classStatusEvents,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  classInstanceQueryDocument,
  classStatusEventsQueryDocument,
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useClassAuditStore } from "@/frontend/common/stores/classAuditStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  AdminNoteDialogStateWithOpen,
  PayrollOverrideDialogState,
} from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel.types";

export function useClassAuditData(id: string) {
  const { data, loading, error, refetch } = useQuery(groupClassAuditQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id,
  });
  const [resendNotifications, { loading: isResending }] = useMutation(resendClassNotificationsMutationDocument);
  return {
    audit: data?.groupClassAudit,
    loading,
    error,
    refetch,
    resendNotifications,
    isResending,
  };
}

interface ClassAuditPayrollSection {
  readonly snapshot: ClassInstanceQuery_classInstance | null;
  readonly statusEvents: readonly ClassStatusEventsQuery_classStatusEvents[] | null;
  readonly openDialog: () => void;
  readonly dialog: PayrollOverrideDialogState;
}

/**
 * Per-instance payroll snapshot for the audit page. The server strips the
 * payroll fields for actors without payroll visibility (they resolve to
 * null), and the queries are skipped client-side in the same case so the
 * payroll card simply never mounts. The instance record doubles as the
 * override dialog's row: both consumers read the same generated fields.
 */
export function useClassAuditPayroll(id: string, refetchAudit: () => void): ClassAuditPayrollSection {
  const hasPermission = useUserStore(state => state.hasPermission);
  const canViewPayroll = hasPermission(AppPermission.AccountingPayrollView);
  const canManagePayroll = hasPermission(AppPermission.AccountingPayrollManage);
  // The override dialog renders payroll data, so both gates must hold: view
  // for the data, manage for the action. A manage-only actor never opens it.
  const canOpenOverride = canViewPayroll && canManagePayroll;

  const { data: instanceData, refetch: refetchInstance } = useQuery(classInstanceQueryDocument, {
    variables: { id },
    skip: !id || !canViewPayroll,
  });
  const { data: eventsData, refetch: refetchEvents } = useQuery(classStatusEventsQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id || !canViewPayroll,
  });

  const open = useClassAuditStore(state => state.overrideDialogOpen);
  const setOpen = useClassAuditStore(state => state.setOverrideDialogOpen);

  const openDialog = useCallback(() => {
    if (!canOpenOverride) return;
    setOpen(true);
  }, [canOpenOverride, setOpen]);
  const closeDialog = useCallback(() => setOpen(false), [setOpen]);
  const onApplied = useCallback(() => {
    refetchAudit();
    void refetchInstance();
    void refetchEvents();
  }, [refetchAudit, refetchInstance, refetchEvents]);

  const snapshot = canViewPayroll ? (instanceData?.classInstance ?? null) : null;
  const statusEvents = canViewPayroll ? (eventsData?.classStatusEvents ?? null) : null;

  return {
    snapshot,
    statusEvents,
    openDialog,
    dialog: { open: open && canOpenOverride, row: snapshot, onClose: closeDialog, onApplied },
  };
}

export function useClassAuditAdminNoteDialog(
  id: string,
  noteContent: string,
  onSaved: () => void
): AdminNoteDialogStateWithOpen {
  const open = useClassAuditStore(state => state.adminNoteDialogOpen);
  const content = useClassAuditStore(state => state.adminNoteDraft);
  const setOpen = useClassAuditStore(state => state.setAdminNoteDialogOpen);
  const setContent = useClassAuditStore(state => state.setAdminNoteDraft);
  const [updateAdminNote, { loading: isSaving }] = useMutation(updateClassAdminNoteMutationDocument);

  const openDialog = useCallback(() => {
    setContent(noteContent);
    setOpen(true);
  }, [noteContent, setContent, setOpen]);

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  const onSave = useCallback(() => {
    const save = async () => {
      try {
        await updateAdminNote({ variables: { classInstanceId: id, content } });
        setOpen(false);
        onSaved();
      } catch (err) {
        logger.error("Error updating admin note:", err);
      }
    };
    void save();
  }, [updateAdminNote, id, content, setOpen, onSaved]);

  return { open, content, isSaving, openDialog, onContentChange: setContent, onClose, onSave };
}
