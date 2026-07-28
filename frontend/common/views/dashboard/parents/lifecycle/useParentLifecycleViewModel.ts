"use client";

import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";
import { type ParentLifecycleLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface ParentLifecycleViewModel {
  readonly labels: ParentLifecycleLabels;
  readonly parent: ParentLifecycleViewProps["parent"];
  readonly isUpdating: boolean;
  readonly onUpdateLifecycle: (
    status: ParentLifecycleViewProps["parent"]["lifecycleStatus"],
    reason: string
  ) => Promise<void>;
}

export type UseParentLifecycleViewModelProps = Omit<ParentLifecycleViewModel, "labels">;

export function useParentLifecycleViewModel(
  props: Readonly<UseParentLifecycleViewModelProps>
): ParentLifecycleViewModel {
  const labels = useAppTranslation(Translation.Dashboard.ParentLifecycle);

  return {
    labels,
    ...props,
  };
}
