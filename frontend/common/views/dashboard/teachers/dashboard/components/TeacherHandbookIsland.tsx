"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { teacherHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface TeacherHandbookIslandProps {
  readonly labels: TeacherDashboardViewLabels;
}

/**
 * Owns the handbook URL fetch (skipped until the user requests it) and
 * registers `onDownloadHandbook` on the shared store. When the URL resolves
 * it opens in a new tab; otherwise an error snackbar surfaces via the store.
 */
export function TeacherHandbookIsland({ labels }: Readonly<TeacherHandbookIslandProps>) {
  const handbookUrlNotFoundMessage = labels.errors.handbookUrlNotFound;
  const setHandlers = useTeacherDashboardStore(state => state.setHandlers);
  const showSnackbar = useTeacherDashboardStore(state => state.showSnackbar);
  const [handbookRequested, setHandbookRequested] = useState(false);
  const handledRef = useRef(false);

  const {
    data: handbookData,
    loading: handbookLoading,
    refetch,
  } = useQuery(teacherHandbookUrlQueryDocument, {
    skip: !handbookRequested,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (!handbookRequested || handbookLoading || handledRef.current) return;
    handledRef.current = true;
    const url = handbookData?.teacherHandbookUrl?.url;
    if (url) {
      globalThis.open(url, "_blank");
    } else {
      showSnackbar(handbookUrlNotFoundMessage, "error");
    }
  }, [handbookRequested, handbookLoading, handbookData, handbookUrlNotFoundMessage, showSnackbar]);

  const handleDownloadHandbook = useCallback(() => {
    handledRef.current = false;
    if (handbookRequested) {
      refetch().catch(() => undefined);
    } else {
      setHandbookRequested(true);
    }
  }, [handbookRequested, refetch]);

  useEffect(() => {
    setHandlers({ onDownloadHandbook: handleDownloadHandbook });
  }, [handleDownloadHandbook, setHandlers]);

  return null;
}
