"use client";

import { ParentsView } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsView";

interface ParentsContainerProps {
  readonly parentId?: string;
}

export function ParentsContainer(_props: ParentsContainerProps) {
  return <ParentsView />;
}

export type {
  ParentsViewModel,
  UseParentsViewModelProps,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
export { ParentsView };
