"use client";

import { useParams } from "next/navigation";
import { logger } from "@/frontend/common/utils/logger";
import { useClassAuditHandlers } from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel.handlers";
import {
  useClassAuditAdminNoteDialog,
  useClassAuditData,
  useClassAuditPayroll,
} from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel.hooks";
import type { ClassAuditViewModel } from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel.types";
import { buildClassAuditLabels } from "@/frontend/common/views/dashboard/classes/audit/utils/classAuditLabels.utils";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

/**
 * View-model union for the class audit page, re-exported from this module so
 * consumers importing from the original path resolve unchanged.
 */
export type { ClassAuditViewModel } from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel.types";

export function useClassAuditViewModel(): ClassAuditViewModel {
  const t = useAppTranslation(Translation.Dashboard.ClassAudit);
  const common = useAppTranslation(Translation.Common);
  const locale = useAppLocale();
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const { audit, loading, error, refetch, resendNotifications, isResending } = useClassAuditData(id);
  const payroll = useClassAuditPayroll(id, refetch);
  const adminNote = useClassAuditAdminNoteDialog(id, audit?.adminNote?.content ?? "", refetch);
  const handlers = useClassAuditHandlers({ id, audit, router, resendNotifications, t, adminNote });

  if (loading && !audit) {
    return { status: "loading", audit: null, labels: {}, isResending, onRetry: refetch };
  }
  if (!id) {
    return { status: "invalidId", audit: null, labels: {}, isResending, onRetry: refetch };
  }
  if (error || !audit) {
    logger.error("Error fetching class audit:", error);
    return { status: "error", audit: null, labels: {}, isResending, onRetry: refetch };
  }

  return {
    status: "ready",
    audit,
    labels: buildClassAuditLabels(t, common.cancel, audit, locale),
    ...handlers,
    isResending,
    onRetry: refetch,
    payroll: payroll.snapshot,
    statusEvents: payroll.statusEvents,
    onOverride: payroll.openDialog,
    adminNoteDialog: {
      open: adminNote.open,
      content: adminNote.content,
      isSaving: adminNote.isSaving,
      onContentChange: adminNote.onContentChange,
      onClose: adminNote.onClose,
      onSave: adminNote.onSave,
    },
    payrollOverrideDialog: payroll.dialog,
  };
}
