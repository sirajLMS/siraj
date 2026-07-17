"use client";

import type { ParentRulesLabels } from "@/shared/locale";

export interface ParentRulesViewModel {
  readonly labels: ParentRulesLabels;
  readonly handbookLoading: boolean;
  readonly onDownloadHandbook: () => void;
}

export type UseParentRulesViewModelProps = ParentRulesViewModel;

export function useParentRulesViewModel(props: Readonly<UseParentRulesViewModelProps>): ParentRulesViewModel {
  const { labels, handbookLoading, onDownloadHandbook } = props;
  return {
    labels,
    handbookLoading,
    onDownloadHandbook,
  };
}
