"use client";

import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";

export interface ParentLifecycleViewModel {
  readonly parent: ParentLifecycleViewProps["parent"];
  readonly isUpdating: boolean;
  readonly onUpdateLifecycle: (
    status: ParentLifecycleViewProps["parent"]["lifecycleStatus"],
    reason: string
  ) => Promise<void>;
}

export type UseParentLifecycleViewModelProps = ParentLifecycleViewModel;

export function useParentLifecycleViewModel(
  props: Readonly<UseParentLifecycleViewModelProps>
): ParentLifecycleViewModel {
  return props;
}
