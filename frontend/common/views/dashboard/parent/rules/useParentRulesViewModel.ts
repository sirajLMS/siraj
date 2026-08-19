"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { parentHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-portal.documents";
import { type ParentRulesLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface ParentRulesViewModel {
  readonly labels: ParentRulesLabels;
  readonly handbookLoading: boolean;
  readonly onDownloadHandbook: () => void;
}

export type UseParentRulesViewModelProps = Record<string, never>;

export function useParentRulesViewModel(_props: Readonly<UseParentRulesViewModelProps>): ParentRulesViewModel {
  const labels = useAppTranslation(Translation.Dashboard.ParentRules);
  const [handbookLoading, setHandbookLoading] = useState(false);

  const { data, loading, refetch } = useQuery(parentHandbookUrlQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const dataRef = useRef(data);
  const refetchRef = useRef(refetch);
  useEffect(() => {
    dataRef.current = data;
    refetchRef.current = refetch;
  });

  const onDownloadHandbook = useCallback(async () => {
    setHandbookLoading(true);
    try {
      if (dataRef.current?.parentHandbookUrl?.url) {
        window.open(dataRef.current.parentHandbookUrl.url, "_blank");
      } else {
        const refetchedData = await refetchRef.current();
        if (refetchedData.data?.parentHandbookUrl?.url) {
          window.open(refetchedData.data.parentHandbookUrl.url, "_blank");
        }
      }
    } finally {
      setHandbookLoading(false);
    }
  }, []);

  return {
    labels,
    handbookLoading: loading || handbookLoading,
    onDownloadHandbook,
  };
}
