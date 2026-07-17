"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useMemo, useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  markTeacherDuesPaidMutationDocument,
  teacherPendingDuesQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDuesStore } from "@/frontend/common/stores/teacherDuesStore";
import { logger } from "@/frontend/common/utils/logger";
import type { TeacherDueRow } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import type { TeacherDuesViewModel } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";
import {
  type UseTeacherDuesViewModelProps,
  useTeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";
import type { SupervisorTeacherDuesLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

const lazyViews = createLazyView<TeacherDuesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/teacher-dues/teacherDues.mobile").then(m => ({
      default: m.TeacherDuesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.desktop").then(m => ({
      default: m.TeacherDuesDesktopView,
    }))
);

type SnackbarSeverity = "success" | "error";

function useLabels(t: SupervisorTeacherDuesLabels) {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      teacherNameColumn: t.teacherNameColumn,
      classDateColumn: t.classDateColumn,
      studentColumn: t.studentColumn,
      hoursColumn: t.hoursColumn,
      amountColumn: t.amountColumn,
      currencyColumn: t.currencyColumn,
      statusColumn: t.statusColumn,
      approvedDateColumn: t.approvedDateColumn,
      markAsPaidButton: t.markAsPaidButton,
      noPendingDues: t.noPendingDues,
      loadingMessage: t.loadingMessage,
      markPaidConfirm: t.markPaidConfirm,
    }),
    [t]
  );
}

export function TeacherDuesContainer() {
  const t = useAppTranslation().dashboardTranslations.supervisorPortalTeacherDues;

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
      setSnackbarMessage(t.markAsPaidButton);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      logger.error("Failed to mark dues as paid:", err);
      setSnackbarMessage("Failed to mark dues as paid");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const props: UseTeacherDuesViewModelProps = {
    rows,
    loading,
    markingPaid,
    selectedDueIds,
    labels,
    onSelectDues: setSelectedDueIds,
    onToggleDue: toggleDueId,
    onMarkPaid: handleMarkPaid,
  };

  const viewModel = useTeacherDuesViewModel(props);

  return (
    <>
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
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </>
  );
}

export type {
  TeacherDuesViewModel,
  UseTeacherDuesViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";
