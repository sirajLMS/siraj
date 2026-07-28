"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { teacherHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { useAppTranslation } from "@/shared/locale";

/**
 * Owns the handbook URL fetch (skipped until the user requests it) and
 * registers `onDownloadHandbook` on the shared store. When the URL resolves
 * it opens in a new tab; otherwise an error snackbar surfaces via the store.
 */
export function TeacherHandbookIsland() {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const setHandlers = useTeacherDashboardStore(state => state.setHandlers);
  const showSnackbar = useTeacherDashboardStore(state => state.showSnackbar);
  const [handbookRequested, setHandbookRequested] = useState(false);

  const { data: handbookData, loading: handbookLoading } = useQuery(teacherHandbookUrlQueryDocument, {
    skip: !handbookRequested,
  });

  useEffect(() => {
    if (!handbookRequested || handbookLoading) return;
    const url = handbookData?.teacherHandbookUrl?.url;
    if (url) {
      globalThis.open(url, "_blank");
    } else {
      showSnackbar(t.errors.handbookUrlNotFound, "error");
    }
    setHandbookRequested(false);
  }, [handbookRequested, handbookLoading, handbookData, t, showSnackbar]);

  const handleDownloadHandbook = useCallback(() => {
    setHandbookRequested(true);
  }, []);

  useEffect(() => {
    setHandlers({ onDownloadHandbook: handleDownloadHandbook });
  }, [handleDownloadHandbook, setHandlers]);

  return null;
}
