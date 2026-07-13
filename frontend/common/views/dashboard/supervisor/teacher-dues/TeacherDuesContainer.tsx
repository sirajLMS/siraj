"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  markTeacherDuesPaidMutationDocument,
  teacherPendingDuesQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDuesStore } from "@/frontend/common/stores/teacherDuesStore";
import { logger } from "@/frontend/common/utils/logger";
import { TeacherDuesView } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/teacherDuesView";
import type { TeacherDueRow } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";

type SnackbarSeverity = "success" | "error";

function useLabels(t: ReturnType<typeof useTranslations<"dashboard.supervisorPortal.teacherDues">>) {
  return useMemo(
    () => ({
      pageTitle: t("pageTitle"),
      teacherNameColumn: t("teacherNameColumn"),
      classDateColumn: t("classDateColumn"),
      studentColumn: t("studentColumn"),
      hoursColumn: t("hoursColumn"),
      amountColumn: t("amountColumn"),
      currencyColumn: t("currencyColumn"),
      statusColumn: t("statusColumn"),
      approvedDateColumn: t("approvedDateColumn"),
      markAsPaidButton: t("markAsPaidButton"),
      noPendingDues: t("noPendingDues"),
      loadingMessage: t("loadingMessage"),
      markPaidConfirm: t("markPaidConfirm"),
    }),
    [t]
  );
}

export function TeacherDuesContainer() {
  const t = useTranslations("dashboard.supervisorPortal.teacherDues");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("success");

  const selectedDueIds = useTeacherDuesStore(s => s.selectedDueIds);
  const setSelectedDueIds = useTeacherDuesStore(s => s.setSelectedDueIds);
  const toggleDueId = useTeacherDuesStore(s => s.toggleDueId);
  const clearSelection = useTeacherDuesStore(s => s.clearSelection);

  const { data, loading } = useQuery(teacherPendingDuesQueryDocument, {
    variables: { teacherId: null },
    fetchPolicy: "cache-and-network",
  });

  const [markPaid, { loading: markingPaid }] = useMutation(markTeacherDuesPaidMutationDocument);

  const rows: TeacherDueRow[] = useMemo(() => {
    const items = data?.teacherPendingDues ?? [];
    return items.map(r => ({
      id: r?.id ?? "",
      teacherId: r?.teacherId ?? "",
      classInstanceId: r?.classInstanceId ?? "",
      studentId: r?.studentId ?? "",
      hours: r?.hours ?? "0",
      amount: r?.amount ?? "0",
      currency: r?.currency ?? null,
      status: r?.status ?? null,
      approvedAt: r?.approvedAt ?? "",
      teacherPaymentId: r?.teacherPaymentId ?? "",
    }));
  }, [data]);

  const labels = useLabels(t);

  const handleMarkPaid = async (dueIds: string[]) => {
    if (dueIds.length === 0) return;
    const teacherPaymentId = rows.find(r => dueIds.includes(r.id))?.teacherPaymentId || "manual";
    try {
      await markPaid({ variables: { dueIds, teacherPaymentId } });
      clearSelection();
      setSnackbarMessage(t("markAsPaidButton"));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      logger.error("Failed to mark dues as paid:", err);
      setSnackbarMessage("Failed to mark dues as paid");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <TeacherDuesView
        rows={rows}
        loading={loading}
        markingPaid={markingPaid}
        selectedDueIds={selectedDueIds}
        labels={labels}
        onSelectDues={setSelectedDueIds}
        onToggleDue={toggleDueId}
        onMarkPaid={handleMarkPaid}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
