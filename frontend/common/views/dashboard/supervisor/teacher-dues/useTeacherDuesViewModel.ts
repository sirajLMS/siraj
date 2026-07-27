"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  markTeacherDuesPaidMutationDocument,
  teacherPendingDuesQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDuesStore } from "@/frontend/common/stores/teacherDuesStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  TeacherDueRow,
  TeacherDuesSnackbarState,
  TeacherDuesViewModel,
  UseTeacherDuesViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import { useAppTranslation } from "@/shared/locale";

export type { TeacherDuesViewModel, UseTeacherDuesViewModelProps };

const EMPTY_SNACKBAR: TeacherDuesSnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

function groupDueIdsByPaymentId(dueIds: readonly string[], rows: readonly TeacherDueRow[]): Map<string, string[]> {
  const byPayment = new Map<string, string[]>();
  for (const dueId of dueIds) {
    const row = rows.find(r => r.id === dueId);
    const paymentId = row?.teacherPaymentId?.trim() ?? "";
    if (!paymentId) continue;
    const existing = byPayment.get(paymentId) ?? [];
    existing.push(dueId);
    byPayment.set(paymentId, existing);
  }
  return byPayment;
}

export function useTeacherDuesViewModel(_props: Readonly<UseTeacherDuesViewModelProps> = {}): TeacherDuesViewModel {
  const t = useAppTranslation().dashboardTranslations.supervisorPortalTeacherDues;
  const { hasPermission } = useUserStore();
  const canMarkPaid = hasPermission(AppPermission.TeacherDuesMarkPaid);

  const [snackbar, setSnackbar] = useState<TeacherDuesSnackbarState>(EMPTY_SNACKBAR);

  const selectedDueIds = useTeacherDuesStore(s => s.selectedDueIds);
  const setSelectedDueIds = useTeacherDuesStore(s => s.setSelectedDueIds);
  const toggleDueId = useTeacherDuesStore(s => s.toggleDueId);
  const clearSelection = useTeacherDuesStore(s => s.clearSelection);

  const { data, loading, refetch } = useQuery(teacherPendingDuesQueryDocument, {
    variables: { teacherId: null },
    fetchPolicy: "cache-and-network",
  });

  const [markPaid, { loading: markingPaid }] = useMutation(markTeacherDuesPaidMutationDocument);

  const rows: TeacherDueRow[] = useMemo(() => {
    const items = data?.teacherPendingDues ?? [];
    return items.map(r => ({
      id: r?.id ?? "",
      teacherId: r?.teacherId ?? "",
      teacherName: r?.teacherName ?? "",
      teacherUserId: r?.teacherUserId ?? "",
      teacherAvatarUrl: r?.teacherAvatarUrl ?? "",
      classInstanceId: r?.classInstanceId ?? "",
      classDate: r?.classDate ?? "",
      studentId: r?.studentId ?? "",
      studentName: r?.studentName ?? "",
      studentAvatarUrl: r?.studentAvatarUrl ?? "",
      hours: r?.hours ?? "0",
      amount: r?.amount ?? "0",
      currency: r?.currency ?? null,
      status: r?.status ?? null,
      approvedAt: r?.approvedAt ?? "",
      teacherPaymentId: r?.teacherPaymentId ?? "",
      rateSource: r?.rateSource ?? null,
    }));
  }, [data]);

  const handleMarkPaid = async (dueIds: string[]) => {
    if (!canMarkPaid || dueIds.length === 0) return;

    const groups = groupDueIdsByPaymentId(dueIds, rows);
    if (groups.size === 0) {
      setSnackbar({ open: true, message: t.markPaidMissingPayment, severity: "error" });
      return;
    }

    try {
      for (const [teacherPaymentId, groupDueIds] of groups) {
        await markPaid({ variables: { dueIds: groupDueIds, teacherPaymentId } });
      }
      clearSelection();
      await refetch();
      setSnackbar({ open: true, message: t.markPaidSuccess, severity: "success" });
    } catch (err) {
      logger.error("Failed to mark dues as paid:", err);
      setSnackbar({ open: true, message: t.markPaidError, severity: "error" });
    }
  };

  return {
    rows,
    loading,
    markingPaid,
    canMarkPaid,
    selectedDueIds,
    snackbar,
    labels: t,
    onSelectDues: setSelectedDueIds,
    onToggleDue: toggleDueId,
    onMarkPaid: handleMarkPaid,
    onCloseSnackbar: () => setSnackbar(EMPTY_SNACKBAR),
  };
}
